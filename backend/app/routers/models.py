from fastapi import APIRouter
import requests

router = APIRouter()

@router.get("/models")
async def get_models():
    """Fetch available models from local Ollama instance."""
    try:
        # Use a short timeout to prevent hanging the UI
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models_data = response.json().get('models', [])
            # Return model names sorted
            names = sorted([model['name'] for model in models_data])
            return names if names else ["gpt-oss:20b"]
        return ["gpt-oss:20b"]
    except Exception:
        # Silently fallback to a safe model if Ollama is unreachable
        return ["gpt-oss:20b"]
