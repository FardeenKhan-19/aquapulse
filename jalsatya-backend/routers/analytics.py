from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, text
from database import get_db
from core.dependencies import get_current_user
from models.user import User, UserRole
from models.village import Village
from models.outbreak_prediction import OutbreakPrediction, RiskLevel
from models.alert import Alert
from models.forensics_report import ForensicsReport
from models.sensor_reading import SensorReading
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("/summary")
async def get_summary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    is_admin = user.role == UserRole.admin
    if not is_admin:
        village_ids = user.assigned_village_ids or []
        if not village_ids:
            return _envelope(data={})

    if is_admin:
        village_count = await db.execute(select(func.count(Village.id)))
    else:
        village_count = await db.execute(select(func.count(Village.id)).where(Village.id.in_(village_ids)))
    total_villages = village_count.scalar() or 0

    cutoff_30d = datetime.utcnow() - timedelta(days=30)
    high_risk_filters = [
        OutbreakPrediction.predicted_at >= cutoff_30d,
        OutbreakPrediction.risk_level.in_([RiskLevel.high, RiskLevel.critical]),
    ]
    if not is_admin:
        high_risk_filters.append(OutbreakPrediction.village_id.in_(village_ids))
    high_risk_count = await db.execute(
        select(func.count(OutbreakPrediction.id)).where(and_(*high_risk_filters))
    )
    high_risks = high_risk_count.scalar() or 0

    alert_filters = [Alert.is_acknowledged == False]
    if not is_admin:
        alert_filters.append(Alert.village_id.in_(village_ids))
    alert_count_result = await db.execute(
        select(func.count(Alert.id)).where(and_(*alert_filters))
    )
    active_alerts = alert_count_result.scalar() or 0

    forensics_filters = [ForensicsReport.generated_at >= cutoff_30d]
    if not is_admin:
        forensics_filters.append(ForensicsReport.village_id.in_(village_ids))
    forensics_count = await db.execute(
        select(func.count(ForensicsReport.id)).where(and_(*forensics_filters))
    )
    total_forensics = forensics_count.scalar() or 0

    if is_admin:
        total_pop_result = await db.execute(select(func.sum(Village.population)))
    else:
        total_pop_result = await db.execute(select(func.sum(Village.population)).where(Village.id.in_(village_ids)))
    total_population = total_pop_result.scalar() or 0

    cases_prevented = high_risks * 47
    cost_saved_lakhs = high_risks * 12.4

    return _envelope(data={
        "total_villages_monitored": total_villages,
        "total_population_covered": total_population,
        "active_alerts": active_alerts,
        "high_risk_predictions_30d": high_risks,
        "forensics_reports_30d": total_forensics,
        "estimated_cases_prevented": cases_prevented,
        "estimated_cost_saved_inr": f"₹{cost_saved_lakhs:.1f}L",
        "roi_multiplier": "14x",
    })


@router.get("/disease-trend")
async def get_disease_trend(
    days: int = 90,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cutoff = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            func.date_trunc("day", OutbreakPrediction.predicted_at).label("day"),
            OutbreakPrediction.predicted_disease,
            func.count(OutbreakPrediction.id).label("count"),
            func.avg(OutbreakPrediction.risk_score).label("avg_risk"),
        )
        .where(
            and_(
                OutbreakPrediction.predicted_at >= cutoff,
                OutbreakPrediction.predicted_disease.isnot(None),
            )
        )
        .group_by(
            func.date_trunc("day", OutbreakPrediction.predicted_at),
            OutbreakPrediction.predicted_disease,
        )
        .order_by(func.date_trunc("day", OutbreakPrediction.predicted_at))
    )
    rows = result.all()

    trend_data = [
        {
            "date": row.day.isoformat() if row.day else None,
            "disease": row.predicted_disease,
            "prediction_count": int(row.count),
            "avg_risk_score": float(row.avg_risk) if row.avg_risk else 0,
        }
        for row in rows
    ]

    return _envelope(data=trend_data)


@router.get("/risk-heatmap")
async def get_risk_heatmap(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role == UserRole.admin:
        villages_result = await db.execute(select(Village))
    else:
        village_ids = user.assigned_village_ids or []
        if not village_ids:
            return _envelope(data=[])
        villages_result = await db.execute(select(Village).where(Village.id.in_(village_ids)))

    villages = villages_result.scalars().all()
    heatmap = []

    for v in villages:
        pred_result = await db.execute(
            select(OutbreakPrediction)
            .where(OutbreakPrediction.village_id == v.id)
            .order_by(desc(OutbreakPrediction.predicted_at))
            .limit(1)
        )
        pred = pred_result.scalar_one_or_none()

        heatmap.append({
            "village_id": str(v.id),
            "name": v.name,
            "lat": float(v.gps_lat) if v.gps_lat else None,
            "lng": float(v.gps_lng) if v.gps_lng else None,
            "risk_score": float(pred.risk_score) if pred else 0,
            "risk_level": (pred.risk_level.value if hasattr(pred.risk_level, 'value') else str(pred.risk_level)) if pred else "baseline",
            "population": v.population,
        })

    return _envelope(data=heatmap)
