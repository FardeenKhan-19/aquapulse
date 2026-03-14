from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import get_db
from core.dependencies import get_current_user
from models.user import User, UserRole
from models.forensics_report import ForensicsReport
from datetime import datetime

router = APIRouter(prefix="/api/forensics", tags=["Forensics"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("")
async def list_forensics(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role == UserRole.admin:
        result = await db.execute(
            select(ForensicsReport).order_by(desc(ForensicsReport.generated_at)).limit(100)
        )
    else:
        village_ids = user.assigned_village_ids or []
        if not village_ids:
            return _envelope(data=[])
        result = await db.execute(
            select(ForensicsReport)
            .where(ForensicsReport.village_id.in_(village_ids))
            .order_by(desc(ForensicsReport.generated_at))
            .limit(100)
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
        }
        for r in reports
    ]
    return _envelope(data=items)


@router.get("/{report_id}")
async def get_forensics_detail(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(ForensicsReport).where(ForensicsReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if user.role != UserRole.admin:
        village_ids = [str(v) for v in (user.assigned_village_ids or [])]
        if str(report.village_id) not in village_ids:
            raise HTTPException(status_code=403, detail="Not authorized")

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
