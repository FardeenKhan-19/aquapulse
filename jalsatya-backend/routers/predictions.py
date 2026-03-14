from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from database import get_db
from core.dependencies import get_current_user
from models.user import User, UserRole
from models.village import Village
from models.outbreak_prediction import OutbreakPrediction
from schemas.outbreak_prediction import SimulateRequest
from services.outbreak_service import OutbreakService
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("/villages")
async def get_all_village_predictions(
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
    result_data = []

    for village in villages:
        pred_result = await db.execute(
            select(OutbreakPrediction)
            .where(OutbreakPrediction.village_id == village.id)
            .order_by(desc(OutbreakPrediction.predicted_at))
            .limit(1)
        )
        pred = pred_result.scalar_one_or_none()

        result_data.append({
            "village_id": str(village.id),
            "village_name": village.name,
            "district": village.district,
            "risk_score": float(pred.risk_score) if pred else 0,
            "risk_level": (pred.risk_level.value if hasattr(pred.risk_level, 'value') else str(pred.risk_level)) if pred else "baseline",
            "predicted_disease": pred.predicted_disease if pred else None,
            "predicted_at": pred.predicted_at.isoformat() + "Z" if pred else None,
        })

    return _envelope(data=result_data)


@router.get("/{village_id}")
async def get_village_prediction_detail(
    village_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != UserRole.admin:
        village_ids = [str(v) for v in (user.assigned_village_ids or [])]
        if village_id not in village_ids:
            raise HTTPException(status_code=403, detail="Not authorized for this village")

    pred_result = await db.execute(
        select(OutbreakPrediction)
        .where(OutbreakPrediction.village_id == village_id)
        .order_by(desc(OutbreakPrediction.predicted_at))
        .limit(1)
    )
    pred = pred_result.scalar_one_or_none()
    if not pred:
        return _envelope(data=None, message="No predictions available")

    return _envelope(data={
        "id": str(pred.id),
        "village_id": str(pred.village_id),
        "predicted_at": pred.predicted_at.isoformat() + "Z",
        "risk_score": float(pred.risk_score),
        "risk_level": pred.risk_level.value if hasattr(pred.risk_level, 'value') else str(pred.risk_level),
        "predicted_disease": pred.predicted_disease,
        "disease_confidence": float(pred.disease_confidence) if pred.disease_confidence else None,
        "affected_population_estimate": pred.affected_population_estimate,
        "onset_hours_estimate": float(pred.onset_hours_estimate) if pred.onset_hours_estimate else None,
        "model_version": pred.model_version,
        "shap_values": pred.shap_values,
        "ensemble_scores": pred.ensemble_scores,
    })


@router.post("/simulate")
async def simulate_prediction(
    request: SimulateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    village_result = await db.execute(select(Village).where(Village.id == request.village_id))
    village = village_result.scalar_one_or_none()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    now = datetime.utcnow()
    features = {
        "tds_ppm": request.tds_ppm or 300,
        "tds_change_30min": 0,
        "tds_change_6hr": 0,
        "temperature_c": request.temperature_c or 28,
        "temp_change_1hr": 0,
        "turbidity_ntu": request.turbidity_ntu or 5,
        "ph": request.ph or 7.0,
        "humidity_pct": request.humidity_pct or 65,
        "flow_rate_lpm": request.flow_rate_lpm or 4.0,
        "hour_of_day": now.hour,
        "day_of_week": now.weekday(),
        "season": 0 if now.month in (3,4,5) else 1 if now.month in (6,7,8,9) else 2 if now.month in (10,11) else 3,
        "rainfall_proxy": 0,
        "historical_outbreak_count": 0,
    }

    service = OutbreakService(db)
    result = await service.simulate_prediction(features, village)

    return _envelope(data=result)
