import ollama
from app.models.chat import ChatRequest, ChatResponse, Message
import requests
import logging

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self, host: str = "http://localhost:11434"):
        self.client = ollama.Client(host=host)
        self.host = host

    def get_available_models(self) -> list:
        """Fetch available models from Ollama."""
        try:
            response = requests.get(f"{self.host}/api/tags", timeout=5)
            if response.status_code == 200:
                models_data = response.json().get('models', [])
                names = sorted([model['name'] for model in models_data])
                if names:
                    logger.info(f"Successfully retrieved {len(names)} models from Ollama")
                    return names
                else:
                    logger.warning("Ollama API returned no models")
                    return []
            else:
                logger.warning(f"Ollama API returned status {response.status_code}")
                return []
        except requests.exceptions.ConnectError:
            logger.error(f"Failed to connect to Ollama at {self.host}")
            return []
        except requests.exceptions.Timeout:
            logger.error("Request to Ollama timed out")
            return []
        except Exception as e:
            logger.error(f"Error fetching models from Ollama: {str(e)}")
            return []

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
            
            logger.debug(f"Ollama response type: {type(response)}")
            logger.debug(f"Ollama response: {response}")
            
            # Convert response to dict if it's not already
            if isinstance(response, dict):
                response_dict = response
            elif hasattr(response, 'model_dump'):
                response_dict = response.model_dump()
            elif hasattr(response, 'dict'):
                response_dict = response.dict()
            else:
                response_dict = vars(response)
            
            logger.debug(f"Response dict: {response_dict}")
            
            # Ensure message is a proper dict (not a Message object yet)
            if 'message' in response_dict:
                msg_obj = response_dict['message']
                if isinstance(msg_obj, dict):
                    # Already a dict, ensure it has the required fields
                    if 'role' not in msg_obj:
                        msg_obj['role'] = 'assistant'
                    if 'content' not in msg_obj:
                        msg_obj['content'] = ''
                elif hasattr(msg_obj, 'model_dump'):
                    response_dict['message'] = msg_obj.model_dump()
                elif hasattr(msg_obj, '__dict__'):
                    response_dict['message'] = vars(msg_obj)
                else:
                    # Last resort - convert to dict manually
                    response_dict['message'] = {
                        'role': getattr(msg_obj, 'role', 'assistant'),
                        'content': getattr(msg_obj, 'content', ''),
                        'images': getattr(msg_obj, 'images', None)
                    }
            
            logger.debug(f"Final response_dict: {response_dict}")
            chat_response = ChatResponse(**response_dict)
            logger.debug(f"ChatResponse created: {chat_response}")
            return chat_response
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

