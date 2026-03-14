from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from database import get_db
from core.dependencies import get_current_health_officer
from models.user import User
from models.forensics_report import ForensicsReport
from models.legal_document import LegalDocument
from services.s3_service import S3Service
from datetime import datetime

router = APIRouter(prefix="/api/ho", tags=["Health Officer - Reports"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("/forensics")
async def get_forensics_reports(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_health_officer),
):
    village_ids = user.assigned_village_ids or []
    if not village_ids:
        return _envelope(data=[])

    result = await db.execute(
        select(ForensicsReport)
        .where(ForensicsReport.village_id.in_(village_ids))
        .order_by(desc(ForensicsReport.generated_at))
        .limit(50)
    )
    reports = result.scalars().all()

    items = [
        {
            "id": str(r.id),
            "village_id": str(r.village_id),
            "generated_at": r.generated_at.isoformat() + "Z",
            "contamination_source": r.contamination_source.value if hasattr(r.contamination_source, 'value') else str(r.contamination_source),
            "source_confidence": float(r.source_confidence) if r.source_confidence else None,
            "tds_baseline": float(r.tds_baseline) if r.tds_baseline else None,
            "tds_peak": float(r.tds_peak) if r.tds_peak else None,
            "upstream_distance_km": float(r.upstream_distance_km) if r.upstream_distance_km else None,
        }
        for r in reports
    ]

    return _envelope(data=items)


@router.get("/forensics/{report_id}")
async def get_forensics_detail(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_health_officer),
):
    result = await db.execute(select(ForensicsReport).where(ForensicsReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    village_ids = [str(v) for v in (user.assigned_village_ids or [])]
    if str(report.village_id) not in village_ids:
        raise HTTPException(status_code=403, detail="Not authorized for this village")

    return _envelope(data={
        "id": str(report.id),
        "village_id": str(report.village_id),
        "outbreak_prediction_id": str(report.outbreak_prediction_id) if report.outbreak_prediction_id else None,
        "generated_at": report.generated_at.isoformat() + "Z",
        "contamination_source": report.contamination_source.value if hasattr(report.contamination_source, 'value') else str(report.contamination_source),
        "source_confidence": float(report.source_confidence) if report.source_confidence else None,
        "contamination_start_timestamp": report.contamination_start_timestamp.isoformat() + "Z" if report.contamination_start_timestamp else None,
        "upstream_distance_km": float(report.upstream_distance_km) if report.upstream_distance_km else None,
        "tds_baseline": float(report.tds_baseline) if report.tds_baseline else None,
        "tds_peak": float(report.tds_peak) if report.tds_peak else None,
        "tds_rise_rate": float(report.tds_rise_rate) if report.tds_rise_rate else None,
        "pattern_signature": report.pattern_signature,
        "supporting_evidence": report.supporting_evidence,
    })


@router.get("/legal")
async def get_legal_documents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_health_officer),
):
    village_ids = user.assigned_village_ids or []
    if not village_ids:
        return _envelope(data=[])

    result = await db.execute(
        select(LegalDocument)
        .where(LegalDocument.village_id.in_(village_ids))
        .order_by(desc(LegalDocument.generated_at))
        .limit(50)
    )
    documents = result.scalars().all()

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
        for d in documents
    ]

    return _envelope(data=items)


@router.get("/legal/{doc_id}/download")
async def download_legal_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_health_officer),
):
    result = await db.execute(select(LegalDocument).where(LegalDocument.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    village_ids = [str(v) for v in (user.assigned_village_ids or [])]
    if str(doc.village_id) not in village_ids:
        raise HTTPException(status_code=403, detail="Not authorized for this village")

    if doc.document_pdf_s3_key:
        s3 = S3Service()
        url = s3.get_presigned_url(doc.document_pdf_s3_key)
        if url:
            return _envelope(data={"download_url": url, "expires_in_seconds": 3600})

    return _envelope(data={
        "download_url": None,
        "content": doc.document_content,
        "note": "PDF not available. Returning raw document content.",
    })
