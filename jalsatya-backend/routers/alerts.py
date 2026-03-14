from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from core.dependencies import get_current_user
from models.user import User, UserRole
from services.alert_service import AlertService
from datetime import datetime

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("/active")
async def get_active_alerts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    alert_service = AlertService(db)
    village_ids = None if user.role == UserRole.admin else (user.assigned_village_ids or [])
    alerts = await alert_service.get_active_alerts(village_ids=village_ids)

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
    return _envelope(data=items)


@router.get("/history")
async def get_alert_history(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    alert_service = AlertService(db)
    village_ids = None if user.role == UserRole.admin else (user.assigned_village_ids or [])
    alerts = await alert_service.get_alert_history(village_ids=village_ids, days=days)

    items = [
        {
            "id": str(a.id),
            "village_id": str(a.village_id),
            "alert_type": a.alert_type.value if hasattr(a.alert_type, 'value') else str(a.alert_type),
            "severity": a.severity.value if hasattr(a.severity, 'value') else str(a.severity),
            "message": a.message,
            "is_acknowledged": a.is_acknowledged,
            "acknowledged_by": str(a.acknowledged_by) if a.acknowledged_by else None,
            "acknowledged_at": a.acknowledged_at.isoformat() + "Z" if a.acknowledged_at else None,
            "created_at": a.created_at.isoformat() + "Z" if a.created_at else None,
        }
        for a in alerts
    ]
    return _envelope(data=items)
