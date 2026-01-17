import ollama
from app.models.chat import ChatRequest, ChatResponse

class OllamaClient:
    def __init__(self, host: str = "http://localhost:11434"):
        self.client = ollama.Client(host=host)

    def chat(self, request: ChatRequest) -> ChatResponse:
        try:
            messages = []
            for msg in request.messages:
                m = msg.model_dump()
                if not m.get('images'):
                    del m['images'] # Ollama expects no images key if empty
                messages.append(m)

            response = self.client.chat(
                model=request.model,
                messages=messages,
                stream=False
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
        except Exception as e:
            if "connection" in str(e).lower():
                raise Exception("Ollama server is not responding. Please make sure Ollama is running.")
            raise e

    def chat_stream(self, request: ChatRequest):
        """Generator for streaming responses."""
        try:
            messages = []
            for msg in request.messages:
                m = msg.model_dump()
                if not m.get('images'):
                    del m['images']
                messages.append(m)

            return self.client.chat(
                model=request.model,
                messages=messages,
                stream=True
            )
        except Exception as e:
            if "connection" in str(e).lower():
                raise Exception("Ollama server is not responding. Please make sure Ollama is running.")
            raise e

