import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.chat import ChatRequest, ChatResponse, Message
from app.services.ollama_client import OllamaClient
from app.services.memory import memory_service
from app.database import get_db
from app.models.db import ChatSession, ChatMessage
import uuid

router = APIRouter()
ollama_client = OllamaClient()

async def get_or_create_session(db: AsyncSession, session_id: str, first_message: str):
    result = await db.get(ChatSession, session_id)
    if not result:
        # Generate a title from the first message (shortened)
        title = (first_message[:40] + '...') if len(first_message) > 40 else first_message
        new_session = ChatSession(id=session_id, title=title)
        db.add(new_session)
        await db.commit()
    return session_id

@router.post("/chat")
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    try:
        user_content = request.messages[-1].content
        
        # Retrieve context from memory
        context = await memory_service.get_relevant_context(user_content, request.session_id)
        if context:
            # Inject context as a system message
            system_msg = Message(role="system", content=f"Relevant context from past conversations:\n{context}")
            request.messages.insert(0, system_msg)

        response = ollama_client.chat(request)
        
        # Save to DB if session_id is provided
        if request.session_id:
            await get_or_create_session(db, request.session_id, user_content)
            db.add(ChatMessage(session_id=request.session_id, role="user", content=user_content))
            db.add(ChatMessage(session_id=request.session_id, role="assistant", content=response.message.content))
            await db.commit()
            
            # Save to Vector Memory
            await memory_service.add_interaction(request.session_id, user_content, response.message.content)
        
        # Return response as dict - must convert nested Pydantic models
        return response.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Streaming chat endpoint using Server-Sent Events."""
    if not request.session_id:
        request.session_id = str(uuid.uuid4())

    user_content = request.messages[-1].content
    
    # Retrieve context from memory
    context = await memory_service.get_relevant_context(user_content, request.session_id)
    if context:
        system_msg = Message(role="system", content=f"Relevant context from past conversations:\n{context}")
        request.messages.insert(0, system_msg)

    async def generate():
        full_content = ""
        
        # Ensure session exists
        await get_or_create_session(db, request.session_id, user_content)
        db.add(ChatMessage(session_id=request.session_id, role="user", content=user_content))
        await db.commit()

        try:
            for chunk in ollama_client.chat_stream(request):
                if 'message' in chunk and 'content' in chunk['message']:
                    content = chunk['message']['content']
                    full_content += content
                    yield f"data: {json.dumps(chunk)}\n\n"
            
            # Save full assistant response at the end
            db.add(ChatMessage(session_id=request.session_id, role="assistant", content=full_content))
            await db.commit()
            
            # Save to Vector Memory
            await memory_service.add_interaction(request.session_id, user_content, full_content)
            
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

