from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class LegalDocumentResponse(BaseModel):
    id: UUID
    forensics_report_id: UUID
    village_id: UUID
    document_type: str
    generated_at: datetime
    document_content: Optional[str]
    document_pdf_s3_key: Optional[str]
    filing_status: str
    filed_at: Optional[datetime]
    filing_reference: Optional[str]
    recipient: Optional[str]
    claude_model_used: Optional[str]
    prompt_tokens_used: Optional[int]
    completion_tokens_used: Optional[int]

    model_config = {"from_attributes": True}


class LegalDocumentListResponse(BaseModel):
    items: List[LegalDocumentResponse]
    total: int
    page: int
    per_page: int
    pages: int
