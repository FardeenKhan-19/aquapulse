import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Enum as SAEnum
from sqlalchemy import Uuid as UUID
from database import Base
import enum


class DocumentType(str, enum.Enum):
    health_alert = "health_alert"
    legal_affidavit = "legal_affidavit"
    cpcb_complaint = "cpcb_complaint"


class FilingStatus(str, enum.Enum):
    generated = "generated"
    filed = "filed"
    acknowledged = "acknowledged"
    rejected = "rejected"
    under_review = "under_review"


class LegalDocument(Base):
    __tablename__ = "legal_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    forensics_report_id = Column(UUID(as_uuid=True), ForeignKey("forensics_reports.id"), nullable=False)
    village_id = Column(UUID(as_uuid=True), ForeignKey("villages.id"), nullable=False, index=True)
    document_type = Column(SAEnum(DocumentType), nullable=False)
    generated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    document_content = Column(Text, nullable=True)
    document_pdf_s3_key = Column(String, nullable=True)
    filing_status = Column(SAEnum(FilingStatus), default=FilingStatus.generated)
    filed_at = Column(DateTime, nullable=True)
    filing_reference = Column(String, nullable=True)
    recipient = Column(String, nullable=True)
    claude_model_used = Column(String, nullable=True)
    prompt_tokens_used = Column(Integer, nullable=True)
    completion_tokens_used = Column(Integer, nullable=True)
