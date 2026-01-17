from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import get_db
from app.models.db import ChatSession, ChatMessage
from typing import List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class MessageSchema(BaseModel):
    role: str
    content: str
    created_at: datetime

class SessionSchema(BaseModel):
    id: str
    title: str
    created_at: datetime

@router.get("/sessions", response_model=List[SessionSchema])
async def get_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatSession).order_by(ChatSession.created_at.desc()))
    return result.scalars().all()

@router.get("/sessions/{session_id}/messages", response_model=List[MessageSchema])
async def get_session_messages(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    return result.scalars().all()

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(ChatSession).where(ChatSession.id == session_id))
    await db.commit()
    return {"status": "deleted"}
