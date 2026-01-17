from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import chat, models, history
from app.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB on startup
    await init_db()
    yield

app = FastAPI(title="Local AI Companion Backend", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(models.router, prefix="/api", tags=["models"])
app.include_router(history.router, prefix="/api", tags=["history"])

@app.get("/")
async def root():
    return {"message": "Local AI Companion Backend is running"}
