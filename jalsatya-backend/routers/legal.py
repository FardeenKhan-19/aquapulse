from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import get_db
from core.dependencies import get_current_user
from models.user import User, UserRole
from models.legal_document import LegalDocument
from services.s3_service import S3Service
from datetime import datetime

router = APIRouter(prefix="/api/legal", tags=["Legal"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("")
async def list_legal_documents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role == UserRole.admin:
        result = await db.execute(
            select(LegalDocument).order_by(desc(LegalDocument.generated_at)).limit(100)
        )
    else:
        village_ids = user.assigned_village_ids or []
        if not village_ids:
            return _envelope(data=[])
        result = await db.execute(
            select(LegalDocument)
            .where(LegalDocument.village_id.in_(village_ids))
            .order_by(desc(LegalDocument.generated_at))
            .limit(100)
        )

    docs = result.scalars().all()
    items = [
        {
            "id": str(d.id),
            "village_id": str(d.village_id),
            "document_type": d.document_type.value if hasattr(d.document_type, 'value') else str(d.document_type),
            "generated_at": d.generated_at.isoformat() + "Z",
            "filing_status": d.filing_status.value if hasattr(d.filing_status, 'value') else str(d.filing_status),
            "filing_reference": d.filing_reference,
            "recipient": d.recipient,
        }
        for d in docs
    ]
    return _envelope(data=items)


@router.get("/{doc_id}")
async def get_legal_detail(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(LegalDocument).where(LegalDocument.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if user.role != UserRole.admin:
        village_ids = [str(v) for v in (user.assigned_village_ids or [])]
        if str(doc.village_id) not in village_ids:
            raise HTTPException(status_code=403, detail="Not authorized")

    return _envelope(data={
        "id": str(doc.id),
        "forensics_report_id": str(doc.forensics_report_id),
        "village_id": str(doc.village_id),
        "document_type": doc.document_type.value if hasattr(doc.document_type, 'value') else str(doc.document_type),
        "generated_at": doc.generated_at.isoformat() + "Z",
        "document_content": doc.document_content,
        "filing_status": doc.filing_status.value if hasattr(doc.filing_status, 'value') else str(doc.filing_status),
        "filed_at": doc.filed_at.isoformat() + "Z" if doc.filed_at else None,
        "filing_reference": doc.filing_reference,
        "recipient": doc.recipient,
        "claude_model_used": doc.claude_model_used,
        "prompt_tokens_used": doc.prompt_tokens_used,
        "completion_tokens_used": doc.completion_tokens_used,
    })


@router.get("/{doc_id}/download")
async def download_legal_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(LegalDocument).where(LegalDocument.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if user.role != UserRole.admin:
        village_ids = [str(v) for v in (user.assigned_village_ids or [])]
        if str(doc.village_id) not in village_ids:
            raise HTTPException(status_code=403, detail="Not authorized")

    if doc.document_pdf_s3_key:
        s3 = S3Service()
        url = s3.get_presigned_url(doc.document_pdf_s3_key)
        if url:
            return _envelope(data={"download_url": url, "expires_in_seconds": 3600})

    return _envelope(data={"download_url": None, "content": doc.document_content})
