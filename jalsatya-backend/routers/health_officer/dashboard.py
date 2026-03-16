from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from database import get_db
from core.dependencies import get_current_health_officer
from models.user import User
from models.village import Village
from models.outbreak_prediction import OutbreakPrediction
from models.alert import Alert
from models.sensor_reading import SensorReading
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/ho", tags=["Health Officer - Dashboard"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("/dashboard")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_health_officer),
):
    village_ids = user.assigned_village_ids or []
    if not village_ids:
        return _envelope(data={"villages": [], "active_alerts": 0, "risk_summary": {}})

    import uuid
    village_uuids = [uuid.UUID(vid) for vid in village_ids if isinstance(vid, str)]

    villages_result = await db.execute(select(Village).where(Village.id.in_(village_uuids)))
    villages = villages_result.scalars().all()

    alert_count = await db.execute(
        select(func.count(Alert.id)).where(
            and_(Alert.village_id.in_(village_uuids), Alert.is_acknowledged == False)
        )
    )
    active_alerts = alert_count.scalar() or 0

    village_summaries = []
    for village in villages:
        pred_result = await db.execute(
            select(OutbreakPrediction)
            .where(OutbreakPrediction.village_id == village.id)
            .order_by(desc(OutbreakPrediction.predicted_at))
            .limit(1)
        )
        latest_pred = pred_result.scalar_one_or_none()

        village_summaries.append({
            "id": str(village.id),
            "name": village.name,
            "district": village.district,
            "population": village.population,
            "current_risk_score": float(latest_pred.risk_score) if latest_pred else 0,
            "current_risk_level": (latest_pred.risk_level.value if hasattr(latest_pred.risk_level, 'value') else str(latest_pred.risk_level)) if latest_pred else "baseline",
            "predicted_disease": latest_pred.predicted_disease if latest_pred else None,
        })

    risk_counts = {"baseline": 0, "low": 0, "medium": 0, "high": 0, "critical": 0}
    for v in village_summaries:
        level = v.get("current_risk_level", "baseline")
        if level in risk_counts:
            risk_counts[level] += 1

    return _envelope(data={
        "villages": village_summaries,
        "active_alerts": active_alerts,
        "risk_summary": risk_counts,
        "total_villages": len(villages),
    })


@router.get("/villages")
async def get_villages(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_health_officer),
):
    village_ids = user.assigned_village_ids or []
    if not village_ids:
        return _envelope(data=[])

    import uuid
    village_uuids = [uuid.UUID(vid) for vid in village_ids if isinstance(vid, str)]

    result = await db.execute(select(Village).where(Village.id.in_(village_uuids)))
    villages = result.scalars().all()

    items = []
    for v in villages:
        pred_result = await db.execute(
            select(OutbreakPrediction)
            .where(OutbreakPrediction.village_id == v.id)
            .order_by(desc(OutbreakPrediction.predicted_at))
            .limit(1)
        )
        pred = pred_result.scalar_one_or_none()

        items.append({
            "id": str(v.id),
            "name": v.name,
            "district": v.district,
            "state": v.state,
            "population": v.population,
            "primary_water_source": v.primary_water_source,
            "gps_lat": float(v.gps_lat) if v.gps_lat else None,
            "gps_lng": float(v.gps_lng) if v.gps_lng else None,
            "current_risk": {
                "score": float(pred.risk_score) if pred else 0,
                "level": (pred.risk_level.value if hasattr(pred.risk_level, 'value') else str(pred.risk_level)) if pred else "baseline",
                "disease": pred.predicted_disease if pred else None,
                "updated_at": pred.predicted_at.isoformat() + "Z" if pred else None,
            }
        })
    return _envelope(data={
        "items": items,
        "total": len(items),
        "page": 1,
        "per_page": 100,
        "pages": 1
    })


@router.get("/villages/{village_id}/predictions")
async def get_village_predictions(
    village_id: str,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_health_officer),
):
    village_ids = [str(v) for v in (user.assigned_village_ids or [])]
    if village_id not in village_ids:
        raise HTTPException(status_code=403, detail="Village not in your assignment")

    import uuid
    v_uuid = uuid.UUID(village_id)

    cutoff = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(OutbreakPrediction)
        .where(and_(OutbreakPrediction.village_id == v_uuid, OutbreakPrediction.predicted_at >= cutoff))
        .order_by(desc(OutbreakPrediction.predicted_at))
        .limit(500)
    )
    predictions = result.scalars().all()

    items = [
        {
            "id": str(p.id),
            "predicted_at": p.predicted_at.isoformat() + "Z",
            "risk_score": float(p.risk_score),
            "risk_level": p.risk_level.value if hasattr(p.risk_level, 'value') else str(p.risk_level),
            "predicted_disease": p.predicted_disease,
            "disease_confidence": float(p.disease_confidence) if p.disease_confidence else None,
            "affected_population": p.affected_population_estimate,
        }
        for p in predictions
    ]

    return _envelope(data=items)


@router.get("/villages/{village_id}/readings")
async def get_village_readings(
    village_id: str,
    limit: int = 200,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_health_officer),
):
    village_ids = [str(v) for v in (user.assigned_village_ids or [])]
    if village_id not in village_ids:
        raise HTTPException(status_code=403, detail="Village not in your assignment")

    import uuid
    v_uuid = uuid.UUID(village_id)

    result = await db.execute(
        select(SensorReading)
        .where(SensorReading.village_id == v_uuid)
        .order_by(desc(SensorReading.timestamp))
        .limit(limit)
    )
    readings = result.scalars().all()

    items = [
        {
            "id": str(r.id),
            "timestamp": r.timestamp.isoformat() + "Z",
            "tds_ppm": float(r.tds_ppm) if r.tds_ppm else None,
            "temperature_c": float(r.temperature_c) if r.temperature_c else None,
            "turbidity_ntu": float(r.turbidity_ntu) if r.turbidity_ntu else None,
            "ph": float(r.ph) if r.ph else None,
            "humidity_pct": float(r.humidity_pct) if r.humidity_pct else None,
            "flow_rate_lpm": float(r.flow_rate_lpm) if r.flow_rate_lpm else None,
            "is_anomaly": r.is_anomaly,
        }
        for r in readings
    ]

    return _envelope(data=items)


@router.get("/villages/{village_id}/trends")
async def get_village_trends(
    village_id: str,
    days: int = 90,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_health_officer),
):
    village_ids = [str(v) for v in (user.assigned_village_ids or [])]
    if village_id not in village_ids:
        raise HTTPException(status_code=403, detail="Village not in your assignment")

    import uuid
    v_uuid = uuid.UUID(village_id)

    cutoff = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            func.date_trunc("day", OutbreakPrediction.predicted_at).label("day"),
            func.avg(OutbreakPrediction.risk_score).label("avg_risk"),
            func.max(OutbreakPrediction.risk_score).label("max_risk"),
            func.count(OutbreakPrediction.id).label("predictions"),
        )
        .where(and_(OutbreakPrediction.village_id == v_uuid, OutbreakPrediction.predicted_at >= cutoff))
        .group_by(func.date_trunc("day", OutbreakPrediction.predicted_at))
        .order_by(func.date_trunc("day", OutbreakPrediction.predicted_at))
    )
    rows = result.all()

    trend_data = [
        {
            "date": row.day.isoformat() if row.day else None,
            "avg_risk_score": float(row.avg_risk) if row.avg_risk else 0,
            "max_risk_score": float(row.max_risk) if row.max_risk else 0,
            "prediction_count": int(row.predictions),
        }
        for row in rows
    ]

    return _envelope(data=trend_data)
