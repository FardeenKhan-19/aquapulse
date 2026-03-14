from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from models.sensor_reading import SensorReading
from models.outbreak_prediction import OutbreakPrediction, RiskLevel
from models.village import Village
from core.websocket_manager import ws_manager
from ml.outbreak_model import OutbreakPredictor
from services.sensor_service import SensorService
from loguru import logger
import numpy as np
import uuid


class OutbreakService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._predictor: Optional[OutbreakPredictor] = None

    @property
    def predictor(self) -> OutbreakPredictor:
        if self._predictor is None:
            self._predictor = OutbreakPredictor()
            self._predictor.load_model()
        return self._predictor

    async def run_prediction(
        self, reading: SensorReading, village: Village
    ) -> OutbreakPrediction:
        features = await self._build_features(reading, village)
        result = self.predictor.predict(features)

        risk_score = float(result["risk_score"])
        risk_level = self._score_to_level(risk_score, village)

        previous = await self._get_latest_prediction(village.id)
        change_delta = risk_score - float(previous.risk_score) if previous else 0

        population = village.population or 5000
        affected_estimate = int(population * (risk_score / 100) * 0.3)

        prediction = OutbreakPrediction(
            id=uuid.uuid4(),
            village_id=village.id,
            sensor_reading_id=reading.id,
            predicted_at=datetime.utcnow(),
            risk_score=risk_score,
            risk_level=risk_level,
            predicted_disease=result.get("disease"),
            disease_confidence=result.get("disease_confidence"),
            affected_population_estimate=affected_estimate,
            onset_hours_estimate=result.get("onset_hours", 48),
            model_version=result.get("model_version", "1.0"),
            shap_values=result.get("shap_values", {}),
            ensemble_scores=result.get("ensemble_scores", {}),
        )

        self.db.add(prediction)
        await self.db.commit()
        await self.db.refresh(prediction)

        await ws_manager.broadcast_prediction(
            village_id=str(village.id),
            risk_score=risk_score,
            risk_level=risk_level.value,
            change_delta=change_delta,
        )

        return prediction

    async def _build_features(self, reading: SensorReading, village: Village) -> Dict[str, float]:
        now = reading.timestamp or datetime.utcnow()

        result_30m = await self.db.execute(
            select(SensorReading)
            .where(
                and_(
                    SensorReading.village_id == village.id,
                    SensorReading.timestamp >= now - timedelta(minutes=30),
                    SensorReading.timestamp < now,
                )
            )
            .order_by(desc(SensorReading.timestamp))
            .limit(10)
        )
        readings_30m = result_30m.scalars().all()

        result_6h = await self.db.execute(
            select(SensorReading)
            .where(
                and_(
                    SensorReading.village_id == village.id,
                    SensorReading.timestamp >= now - timedelta(hours=6),
                    SensorReading.timestamp < now,
                )
            )
            .order_by(desc(SensorReading.timestamp))
            .limit(50)
        )
        readings_6h = result_6h.scalars().all()

        result_1h = await self.db.execute(
            select(SensorReading)
            .where(
                and_(
                    SensorReading.village_id == village.id,
                    SensorReading.timestamp >= now - timedelta(hours=1),
                    SensorReading.timestamp < now,
                )
            )
            .order_by(desc(SensorReading.timestamp))
            .limit(20)
        )
        readings_1h = result_1h.scalars().all()

        tds_now = float(reading.tds_ppm) if reading.tds_ppm else 250.0
        tds_30m_vals = [float(r.tds_ppm) for r in readings_30m if r.tds_ppm is not None]
        tds_6h_vals = [float(r.tds_ppm) for r in readings_6h if r.tds_ppm is not None]
        temp_1h_vals = [float(r.temperature_c) for r in readings_1h if r.temperature_c is not None]
        humidity_vals = [float(r.humidity_pct) for r in readings_6h if r.humidity_pct is not None]

        tds_change_30m = tds_now - np.mean(tds_30m_vals) if tds_30m_vals else 0.0
        tds_change_6h = tds_now - np.mean(tds_6h_vals) if tds_6h_vals else 0.0
        temp_now = float(reading.temperature_c) if reading.temperature_c else 28.0
        temp_change_1h = temp_now - np.mean(temp_1h_vals) if temp_1h_vals else 0.0

        humidity_now = float(reading.humidity_pct) if reading.humidity_pct else 65.0
        humidity_prev = np.mean(humidity_vals[-5:]) if len(humidity_vals) >= 5 else humidity_now
        rainfall_proxy = max(0, humidity_now - humidity_prev)

        outbreak_count = await self.db.execute(
            select(func.count(OutbreakPrediction.id))
            .where(
                and_(
                    OutbreakPrediction.village_id == village.id,
                    OutbreakPrediction.risk_level.in_([RiskLevel.high, RiskLevel.critical]),
                    OutbreakPrediction.predicted_at >= now - timedelta(days=90),
                )
            )
        )
        hist_outbreaks = outbreak_count.scalar() or 0

        month = now.month
        if month in (3, 4, 5):
            season = 0
        elif month in (6, 7, 8, 9):
            season = 1
        elif month in (10, 11):
            season = 2
        else:
            season = 3

        features = {
            "tds_ppm": tds_now,
            "tds_change_30min": float(tds_change_30m),
            "tds_change_6hr": float(tds_change_6h),
            "temperature_c": temp_now,
            "temp_change_1hr": float(temp_change_1h),
            "turbidity_ntu": float(reading.turbidity_ntu) if reading.turbidity_ntu else 5.0,
            "ph": float(reading.ph) if reading.ph else 7.0,
            "humidity_pct": humidity_now,
            "flow_rate_lpm": float(reading.flow_rate_lpm) if reading.flow_rate_lpm else 4.0,
            "hour_of_day": now.hour,
            "day_of_week": now.weekday(),
            "season": season,
            "rainfall_proxy": float(rainfall_proxy),
            "historical_outbreak_count": min(hist_outbreaks, 20),
        }

        return features

    def _score_to_level(self, score: float, village: Village) -> RiskLevel:
        t_critical = float(village.risk_threshold_critical or 88)
        t_high = float(village.risk_threshold_high or 75)
        t_medium = float(village.risk_threshold_medium or 55)
        t_low = float(village.risk_threshold_low or 30)

        if score >= t_critical:
            return RiskLevel.critical
        elif score >= t_high:
            return RiskLevel.high
        elif score >= t_medium:
            return RiskLevel.medium
        elif score >= t_low:
            return RiskLevel.low
        else:
            return RiskLevel.baseline

    async def _get_latest_prediction(self, village_id) -> Optional[OutbreakPrediction]:
        result = await self.db.execute(
            select(OutbreakPrediction)
            .where(OutbreakPrediction.village_id == village_id)
            .order_by(desc(OutbreakPrediction.predicted_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_predictions_for_village(
        self, village_id, days: int = 30, limit: int = 100
    ) -> List[OutbreakPrediction]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        result = await self.db.execute(
            select(OutbreakPrediction)
            .where(
                and_(
                    OutbreakPrediction.village_id == village_id,
                    OutbreakPrediction.predicted_at >= cutoff,
                )
            )
            .order_by(desc(OutbreakPrediction.predicted_at))
            .limit(limit)
        )
        return result.scalars().all()

    async def simulate_prediction(self, features: Dict[str, float], village: Village) -> Dict[str, Any]:
        result = self.predictor.predict(features)
        risk_score = float(result["risk_score"])
        risk_level = self._score_to_level(risk_score, village)

        return {
            "risk_score": risk_score,
            "risk_level": risk_level.value,
            "predicted_disease": result.get("disease"),
            "disease_confidence": result.get("disease_confidence"),
            "shap_values": result.get("shap_values", {}),
            "ensemble_scores": result.get("ensemble_scores", {}),
            "note": "This is a simulation. No data was saved.",
        }
