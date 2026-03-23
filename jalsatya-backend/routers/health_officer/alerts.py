from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from core.dependencies import get_current_health_officer
from models.user import User
from services.alert_service import AlertService
from datetime import datetime

router = APIRouter(prefix="/api/ho", tags=["Health Officer - Alerts"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("/alerts")
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_health_officer),
):
    village_ids = user.assigned_village_ids or []
    if not village_ids:
        return _envelope(data=[])

    import uuid
    village_uuids = [uuid.UUID(vid) for vid in village_ids if isinstance(vid, str)]

    alert_service = AlertService(db)
    alerts = await alert_service.get_active_alerts(village_ids=village_uuids)

    items = [
        {
            "id": str(a.id),
            "village_id": str(a.village_id),
            "alert_type": a.alert_type.value if hasattr(a.alert_type, 'value') else str(a.alert_type),
            "severity": a.severity.value if hasattr(a.severity, 'value') else str(a.severity),
            "message": a.message,
            "is_acknowledged": a.is_acknowledged,
            "created_at": a.created_at.isoformat() + "Z" if a.created_at else None,
        }
        for a in alerts
    ]
    return _envelope(data={
        "items": items,
        "total": len(items),
        "page": 1,
        "per_page": 100,
        "pages": 1
    })


@router.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_health_officer),
):
    alert_service = AlertService(db)
    alert = await alert_service.acknowledge_alert(alert_id, user.id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return _envelope(message="Alert acknowledged", data={
        "id": str(alert.id),
        "acknowledged_by": str(user.id),
        "acknowledged_at": alert.acknowledged_at.isoformat() + "Z" if alert.acknowledged_at else None,
    })
