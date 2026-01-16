from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse
from app.services.ollama_client import OllamaClient

router = APIRouter()
ollama_client = OllamaClient()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = ollama_client.chat(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
