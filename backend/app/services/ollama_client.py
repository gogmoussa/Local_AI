import ollama
from app.models.chat import ChatRequest, ChatResponse

class OllamaClient:
    def __init__(self, host: str = "http://localhost:11434"):
        self.client = ollama.Client(host=host)

    def chat(self, request: ChatRequest) -> ChatResponse:
        response = self.client.chat(
            model=request.model,
            messages=[msg.model_dump() for msg in request.messages],
            stream=request.stream
        )
        
        if isinstance(response, dict):
            return ChatResponse(**response)
        
        # If response is an object (e.g. Pydantic model from ollama library)
        if hasattr(response, 'model_dump'):
            return ChatResponse(**response.model_dump())
        elif hasattr(response, 'dict'):
             return ChatResponse(**response.dict())
        else:
             # Fallback
             return ChatResponse(**vars(response))

    # Future: Add streaming support if needed
