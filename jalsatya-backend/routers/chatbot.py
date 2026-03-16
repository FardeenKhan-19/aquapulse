from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.chatbot import ChatMessageRequest
from services.chatbot_service import ChatbotService
from datetime import datetime

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.post("/message")
async def chat(
    request: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = ChatbotService(db)
    result = await service.chat(
        user=user,
        message=request.message,
        session_id=str(request.session_id) if request.session_id else None,
    )
    return _envelope(data=result)


@router.get("/suggestions")
async def get_suggestions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = ChatbotService(db)
    suggestions = await service.get_suggestions(user)
    # The frontend expects an array of strings
    suggestion_strings = [s["question"] for s in suggestions]
    return _envelope(data=suggestion_strings)


@router.get("/sessions/{session_id}/messages")
async def get_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = ChatbotService(db)
    result = await service.get_session_history(user, session_id)
    return _envelope(data=result.get("messages", []))

@router.get("/sessions")
async def get_sessions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = ChatbotService(db)
    sessions = await service.get_user_sessions(user)
    return _envelope(data=sessions)

@router.post("/sessions")
async def create_session(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = ChatbotService(db)
    session = await service.create_session(user)
    return _envelope(data=session)
