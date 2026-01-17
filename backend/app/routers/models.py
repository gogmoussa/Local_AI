from fastapi import APIRouter
import logging
from app.services.ollama_client import OllamaClient

router = APIRouter()
logger = logging.getLogger(__name__)
ollama_client = OllamaClient()

@router.get("/models")
async def get_models():
    """Fetch available models from local Ollama instance."""
    models = ollama_client.get_available_models()
    logger.debug(f"Returning {len(models)} models: {models}")
    return models
