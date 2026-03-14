from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[UUID] = None



class ChatMessageResponse(BaseModel):
    session_id: UUID
    message_id: UUID
    role: str
    content: str
    timestamp: datetime
    tokens_used: Optional[int]


class ChatSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    session_start: datetime
    session_end: Optional[datetime]
    message_count: int

    model_config = {"from_attributes": True}


class ChatHistoryResponse(BaseModel):
    session: ChatSessionResponse
    messages: List[ChatMessageResponse]


class SuggestedQuestion(BaseModel):
    question: str
    category: str
    relevance_score: float
