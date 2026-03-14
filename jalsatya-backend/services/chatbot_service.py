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
import anthropic
import uuid


SYSTEM_PROMPT = """You are AquaPulse AI Assistant, helping health officers in rural India monitor water quality and respond to disease outbreak risks. You have access to real-time sensor data and AI predictions. Answer in clear, actionable language. When asked about contamination sources, reference the forensics report data provided. When asked about legal cases, explain the auto-filed documents. Always prioritize actionable guidance: what to do RIGHT NOW to prevent illness.

You have the following context about the user and their villages. Use this to answer questions accurately."""


class ChatbotService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._client: Optional[anthropic.Anthropic] = None

    @property
    def claude_client(self) -> anthropic.Anthropic:
        if self._client is None:
            self._client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._client

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

        messages = []
        for msg in prev_messages:
            role = "user" if msg.role == MessageRole.user or msg.role == "user" else "assistant"
            messages.append({"role": role, "content": msg.content})

        if not any(m["content"] == message for m in messages):
            messages.append({"role": "user", "content": message})

        system_content = SYSTEM_PROMPT + "\n\n" + context

        try:
            response = self.claude_client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=settings.CLAUDE_MAX_TOKENS,
                system=system_content,
                messages=messages,
            )
            assistant_content = response.content[0].text
            tokens_used = response.usage.input_tokens + response.usage.output_tokens
        except Exception as e:
            logger.error(f"Chatbot Claude call failed: {e}")
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
            villages_result = await self.db.execute(
                select(Village).where(Village.id.in_(village_ids))
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
                        Alert.village_id.in_(village_ids),
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
                        ForensicsReport.village_id.in_(village_ids),
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
                        LegalDocument.village_id.in_(village_ids),
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
            alert_count = await self.db.execute(
                select(func.count(Alert.id)).where(
                    and_(Alert.village_id.in_(village_ids), Alert.is_acknowledged == False)
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
                        ForensicsReport.village_id.in_(village_ids),
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
