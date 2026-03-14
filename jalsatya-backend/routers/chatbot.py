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


@router.post("/chat")
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
    return _envelope(data=suggestions)


@router.get("/history")
async def get_history(
    session_id: str = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    service = ChatbotService(db)
    result = await service.get_session_history(user, session_id)
    return _envelope(data=result)
