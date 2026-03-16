from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from models.chatbot import ChatbotSession, ChatbotMessage, MessageRole
from models.alert import Alert
from models.outbreak_prediction import OutbreakPrediction
from models.forensics_report import ForensicsReport
from models.legal_document import LegalDocument
from models.village import Village
from models.user import User
from config import settings
from loguru import logger
import google.generativeai as genai
import uuid


SYSTEM_PROMPT = """You are AquaPulse AI Assistant, helping health officers in rural India monitor water quality and respond to disease outbreak risks. You have access to real-time sensor data and AI predictions. Answer in clear, actionable language. When asked about contamination sources, reference the forensics report data provided. When asked about legal cases, explain the auto-filed documents. Always prioritize actionable guidance: what to do RIGHT NOW to prevent illness.

You have the following context about the user and their villages. Use this to answer questions accurately."""


class ChatbotService:
    def __init__(self, db: AsyncSession):
        self.db = db
        genai.configure(api_key=settings.GEMINI_API_KEY)

    @property
    def gemini_model(self):
        return genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=SYSTEM_PROMPT
        )

    async def chat(
        self,
        user: User,
        message: str,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        session = None
        if session_id:
            result = await self.db.execute(
                select(ChatbotSession).where(
                    and_(
                        ChatbotSession.id == session_id,
                        ChatbotSession.user_id == user.id,
                    )
                )
            )
            session = result.scalar_one_or_none()

        if not session:
            session = ChatbotSession(
                id=uuid.uuid4(),
                user_id=user.id,
                session_start=datetime.utcnow(),
                message_count=0,
            )
            self.db.add(session)
            await self.db.flush()

        user_msg = ChatbotMessage(
            id=uuid.uuid4(),
            session_id=session.id,
            role=MessageRole.user,
            content=message,
            timestamp=datetime.utcnow(),
        )
        self.db.add(user_msg)
        session.message_count += 1
        await self.db.flush()

        context = await self._build_context(user)

        prev_result = await self.db.execute(
            select(ChatbotMessage)
            .where(ChatbotMessage.session_id == session.id)
            .order_by(desc(ChatbotMessage.timestamp))
            .limit(10)
        )
        prev_messages = list(reversed(prev_result.scalars().all()))

        # For Gemini, system prompt is handled via the model init. We just pass context as the first user message or prepended.
        context_prompt = f"Background Context for User:\n{context}\n\nUser Question: {message}"

        # Gemini history Format
        gemini_history = []
        for msg in prev_messages:
            # Gemini roles: 'user' or 'model'
            role = "user" if msg.role == MessageRole.user or msg.role == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg.content]})

        try:
            chat_session = self.gemini_model.start_chat(history=gemini_history)
            response = chat_session.send_message(context_prompt)
            assistant_content = response.text
            
            # Rough token estimate if usage metadata is available, default to 0
            tokens_used = 0 
            if hasattr(response, 'usage_metadata'):
                tokens_used = response.usage_metadata.total_token_count
                
        except Exception as e:
            logger.error(f"Chatbot Gemini call failed: {e}")
            assistant_content = (
                "I'm sorry, I'm having trouble connecting to my AI service right now. "
                "Please try again in a moment. If the issue persists, contact your administrator."
            )
            tokens_used = 0

        assistant_msg = ChatbotMessage(
            id=uuid.uuid4(),
            session_id=session.id,
            role=MessageRole.assistant,
            content=assistant_content,
            timestamp=datetime.utcnow(),
            context_data={"context_summary": "Context provided with active alerts and predictions"},
            tokens_used=tokens_used,
        )
        self.db.add(assistant_msg)
        session.message_count += 1
        await self.db.commit()

        return {
            "session_id": str(session.id),
            "message_id": str(assistant_msg.id),
            "role": "assistant",
            "content": assistant_content,
            "timestamp": assistant_msg.timestamp.isoformat() + "Z",
            "tokens_used": tokens_used,
        }

    async def _build_context(self, user: User) -> str:
        village_ids = user.assigned_village_ids or []
        parts = [f"User: {user.full_name} (Role: {user.role.value if hasattr(user.role, 'value') else user.role})"]

        if village_ids:
            village_uuids = [uuid.UUID(vid) for vid in village_ids if isinstance(vid, str)]
            villages_result = await self.db.execute(
                select(Village).where(Village.id.in_(village_uuids))
            )
            villages = villages_result.scalars().all()
            parts.append(f"Assigned Villages: {', '.join(v.name for v in villages)}")

            for village in villages:
                pred_result = await self.db.execute(
                    select(OutbreakPrediction)
                    .where(
                        and_(
                            OutbreakPrediction.village_id == village.id,
                            OutbreakPrediction.predicted_at >= datetime.utcnow() - timedelta(hours=6),
                        )
                    )
                    .order_by(desc(OutbreakPrediction.predicted_at))
                    .limit(3)
                )
                preds = pred_result.scalars().all()
                if preds:
                    latest = preds[0]
                    risk_level = latest.risk_level.value if hasattr(latest.risk_level, 'value') else str(latest.risk_level)
                    parts.append(
                        f"\n{village.name} Latest Prediction: Risk {float(latest.risk_score):.1f}/100 "
                        f"({risk_level}), Disease: {latest.predicted_disease or 'None'}"
                    )

            alert_result = await self.db.execute(
                select(Alert)
                .where(
                    and_(
                        Alert.village_id.in_(village_uuids),
                        Alert.is_acknowledged == False,
                    )
                )
                .order_by(desc(Alert.created_at))
                .limit(10)
            )
            alerts = alert_result.scalars().all()
            if alerts:
                parts.append(f"\nActive Alerts ({len(alerts)}):")
                for a in alerts[:5]:
                    parts.append(f"  - [{a.severity.value if hasattr(a.severity, 'value') else a.severity}] {a.message}")

            forensics_result = await self.db.execute(
                select(ForensicsReport)
                .where(
                    and_(
                        ForensicsReport.village_id.in_(village_uuids),
                        ForensicsReport.generated_at >= datetime.utcnow() - timedelta(days=7),
                    )
                )
                .order_by(desc(ForensicsReport.generated_at))
                .limit(5)
            )
            forensics = forensics_result.scalars().all()
            if forensics:
                parts.append(f"\nRecent Forensics Reports:")
                for f in forensics:
                    source = f.contamination_source.value if hasattr(f.contamination_source, 'value') else str(f.contamination_source)
                    parts.append(
                        f"  - Source: {source}, Confidence: {float(f.source_confidence or 0)*100:.1f}%"
                    )

            legal_result = await self.db.execute(
                select(LegalDocument)
                .where(
                    and_(
                        LegalDocument.village_id.in_(village_uuids),
                        LegalDocument.generated_at >= datetime.utcnow() - timedelta(days=7),
                    )
                )
                .order_by(desc(LegalDocument.generated_at))
                .limit(5)
            )
            legals = legal_result.scalars().all()
            if legals:
                parts.append(f"\nLegal Documents:")
                for ld in legals:
                    doc_type = ld.document_type.value if hasattr(ld.document_type, 'value') else str(ld.document_type)
                    status = ld.filing_status.value if hasattr(ld.filing_status, 'value') else str(ld.filing_status)
                    parts.append(f"  - {doc_type}: Status={status}, Ref={ld.filing_reference or 'pending'}")

        return "\n".join(parts)

    async def get_suggestions(self, user: User) -> List[Dict[str, Any]]:
        village_ids = user.assigned_village_ids or []
        suggestions = [
            {"question": "Which village is at highest risk right now?", "category": "risk", "relevance_score": 0.95},
            {"question": "How many people are at risk today?", "category": "risk", "relevance_score": 0.9},
        ]

        if village_ids:
            village_uuids = [uuid.UUID(vid) for vid in village_ids if isinstance(vid, str)]
            alert_count = await self.db.execute(
                select(func.count(Alert.id)).where(
                    and_(Alert.village_id.in_(village_uuids), Alert.is_acknowledged == False)
                )
            )
            active = alert_count.scalar() or 0
            if active > 0:
                suggestions.insert(0, {
                    "question": f"Tell me about the {active} active alert(s)",
                    "category": "alerts",
                    "relevance_score": 1.0,
                })

            forensics_count = await self.db.execute(
                select(func.count(ForensicsReport.id)).where(
                    and_(
                        ForensicsReport.village_id.in_(village_uuids),
                        ForensicsReport.generated_at >= datetime.utcnow() - timedelta(days=3),
                    )
                )
            )
            fc = forensics_count.scalar() or 0
            if fc > 0:
                suggestions.append({
                    "question": "What caused the recent contamination?",
                    "category": "forensics",
                    "relevance_score": 0.92,
                })

            suggestions.extend([
                {"question": "What should I tell the sarpanch right now?", "category": "action", "relevance_score": 0.85},
                {"question": "Which sensor has been offline the longest?", "category": "system", "relevance_score": 0.7},
                {"question": "Show me the trend for this month", "category": "analytics", "relevance_score": 0.75},
                {"question": "Was the legal case filed?", "category": "legal", "relevance_score": 0.8},
            ])

        suggestions.sort(key=lambda x: x["relevance_score"], reverse=True)
        return suggestions[:6]

    async def get_session_history(self, user: User, session_id: Optional[str] = None) -> Dict[str, Any]:
        if session_id:
            sess_result = await self.db.execute(
                select(ChatbotSession).where(
                    and_(ChatbotSession.id == session_id, ChatbotSession.user_id == user.id)
                )
            )
        else:
            sess_result = await self.db.execute(
                select(ChatbotSession)
                .where(ChatbotSession.user_id == user.id)
                .order_by(desc(ChatbotSession.session_start))
                .limit(1)
            )
        session = sess_result.scalar_one_or_none()

        if not session:
            return {"session": None, "messages": []}

        msgs_result = await self.db.execute(
            select(ChatbotMessage)
            .where(ChatbotMessage.session_id == session.id)
            .order_by(ChatbotMessage.timestamp)
        )
        messages = msgs_result.scalars().all()

        return {
            "session": {
                "id": str(session.id),
                "user_id": str(session.user_id),
                "session_start": session.session_start.isoformat() + "Z",
                "session_end": session.session_end.isoformat() + "Z" if session.session_end else None,
                "message_count": session.message_count,
            },
            "messages": [
                {
                    "message_id": str(m.id),
                    "role": m.role.value if hasattr(m.role, 'value') else str(m.role),
                    "content": m.content,
                    "timestamp": m.timestamp.isoformat() + "Z",
                    "tokens_used": m.tokens_used,
                }
                for m in messages
            ],
        }

    async def get_user_sessions(self, user: User) -> List[Dict[str, Any]]:
        result = await self.db.execute(
            select(ChatbotSession)
            .where(ChatbotSession.user_id == user.id)
            .order_by(desc(ChatbotSession.session_start))
        )
        sessions = result.scalars().all()
        return [
            {
                "id": str(s.id),
                "title": f"Chat {s.session_start.strftime('%b %d, %H:%M')}",
                "created_at": s.session_start.isoformat() + "Z",
                "updated_at": (s.session_end or s.session_start).isoformat() + "Z",
                "messages_count": s.message_count,
            }
            for s in sessions
        ]

    async def create_session(self, user: User) -> Dict[str, Any]:
        session = ChatbotSession(
            id=uuid.uuid4(),
            user_id=user.id,
            session_start=datetime.utcnow(),
            message_count=0,
        )
        self.db.add(session)
        await self.db.commit()
        return {
            "id": str(session.id),
            "title": f"Chat {session.session_start.strftime('%b %d, %H:%M')}",
            "created_at": session.session_start.isoformat() + "Z",
            "updated_at": session.session_start.isoformat() + "Z",
            "messages_count": 0,
        }
