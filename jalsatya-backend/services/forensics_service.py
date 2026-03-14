from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from models.sensor_reading import SensorReading
from models.outbreak_prediction import OutbreakPrediction
from models.forensics_report import ForensicsReport, ContaminationSource
from models.village import Village
from ml.forensics_model import ForensicsClassifier
from core.websocket_manager import ws_manager
from loguru import logger
import numpy as np
import uuid
from scipy import stats


class ForensicsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._classifier: Optional[ForensicsClassifier] = None

    @property
    def classifier(self) -> ForensicsClassifier:
        if self._classifier is None:
            self._classifier = ForensicsClassifier()
            self._classifier.load_model()
        return self._classifier

    async def analyze_contamination(
        self,
        reading: SensorReading,
        prediction: OutbreakPrediction,
    ) -> ForensicsReport:
        village_result = await self.db.execute(
            select(Village).where(Village.id == reading.village_id)
        )
        village = village_result.scalar_one_or_none()

        four_hours_ago = (reading.timestamp or datetime.utcnow()) - timedelta(hours=4)
        result = await self.db.execute(
            select(SensorReading)
            .where(
                and_(
                    SensorReading.village_id == reading.village_id,
                    SensorReading.timestamp >= four_hours_ago,
                )
            )
            .order_by(SensorReading.timestamp)
        )
        recent_readings = result.scalars().all()

        forty_eight_hours_ago = (reading.timestamp or datetime.utcnow()) - timedelta(hours=48)
        baseline_result = await self.db.execute(
            select(SensorReading)
            .where(
                and_(
                    SensorReading.village_id == reading.village_id,
                    SensorReading.timestamp >= forty_eight_hours_ago,
                    SensorReading.timestamp < four_hours_ago,
                )
            )
        )
        baseline_readings = baseline_result.scalars().all()

        tds_values = [float(r.tds_ppm) for r in recent_readings if r.tds_ppm is not None]
        turb_values = [float(r.turbidity_ntu) for r in recent_readings if r.turbidity_ntu is not None]
        ph_values = [float(r.ph) for r in recent_readings if r.ph is not None]
        flow_values = [float(r.flow_rate_lpm) for r in recent_readings if r.flow_rate_lpm is not None]
        temp_values = [float(r.temperature_c) for r in recent_readings if r.temperature_c is not None]
        humidity_values = [float(r.humidity_pct) for r in recent_readings if r.humidity_pct is not None]

        baseline_tds = [float(r.tds_ppm) for r in baseline_readings if r.tds_ppm is not None]
        tds_baseline_val = float(np.median(baseline_tds)) if baseline_tds else 250.0

        tds_peak = max(tds_values) if tds_values else float(reading.tds_ppm or 250)
        tds_current = float(reading.tds_ppm) if reading.tds_ppm else 250.0
        tds_delta = tds_peak - tds_baseline_val

        if len(tds_values) >= 2:
            timestamps = [(r.timestamp - recent_readings[0].timestamp).total_seconds() / 60
                          for r in recent_readings if r.tds_ppm is not None]
            if len(timestamps) >= 2 and timestamps[-1] - timestamps[0] > 0:
                tds_rise_rate = (max(tds_values) - min(tds_values)) / max(timestamps[-1] - timestamps[0], 1)
            else:
                tds_rise_rate = 0.0
        else:
            tds_rise_rate = 0.0

        if len(tds_values) >= 3:
            tds_diffs = np.diff(tds_values)
            if np.max(np.abs(tds_diffs)) > tds_delta * 0.5:
                spike_pattern = 0  # sharp
            elif np.all(tds_diffs >= -5):
                spike_pattern = 1  # gradual
            elif np.std(tds_diffs) < np.mean(np.abs(tds_diffs)) * 0.3:
                spike_pattern = 2  # sustained
            else:
                spike_pattern = 3  # cyclic
        else:
            spike_pattern = 0

        spike_hour = reading.timestamp.hour if reading.timestamp else 12

        duration_minutes = 0
        if len(tds_values) >= 2:
            threshold = tds_baseline_val * 1.2
            elevated = [i for i, v in enumerate(tds_values) if v > threshold]
            if elevated:
                first_elev = recent_readings[elevated[0]].timestamp
                last_elev = recent_readings[elevated[-1]].timestamp
                duration_minutes = (last_elev - first_elev).total_seconds() / 60

        temp_at_spike = float(reading.temperature_c) if reading.temperature_c else 28.0
        temp_baseline_vals = [float(r.temperature_c) for r in baseline_readings if r.temperature_c is not None]
        temp_baseline = np.mean(temp_baseline_vals) if temp_baseline_vals else 28.0
        temp_delta = temp_at_spike - float(temp_baseline)

        turb_tds_corr = False
        if len(tds_values) >= 5 and len(turb_values) >= 5:
            min_len = min(len(tds_values), len(turb_values))
            if min_len >= 3:
                r_val, _ = stats.pearsonr(tds_values[:min_len], turb_values[:min_len])
                turb_tds_corr = abs(r_val) > 0.7

        ph_baseline_vals = [float(r.ph) for r in baseline_readings if r.ph is not None]
        ph_baseline = np.mean(ph_baseline_vals) if ph_baseline_vals else 7.0
        ph_drop = float(ph_baseline) - (float(reading.ph) if reading.ph else 7.0)

        flow_baseline_vals = [float(r.flow_rate_lpm) for r in baseline_readings if r.flow_rate_lpm is not None]
        flow_mean = np.mean(flow_baseline_vals) if flow_baseline_vals else 4.0
        flow_std = np.std(flow_baseline_vals) if len(flow_baseline_vals) > 1 else 1.0
        flow_current = float(reading.flow_rate_lpm) if reading.flow_rate_lpm else 4.0
        flow_anomaly = abs(flow_current - float(flow_mean)) > 2 * max(float(flow_std), 0.5)

        humidity_at_spike = float(reading.humidity_pct) if reading.humidity_pct else 65.0

        humidity_prev = humidity_values[-5:] if len(humidity_values) >= 5 else humidity_values
        rain_4hr = any(h > 80 for h in humidity_prev) if humidity_prev else False

        features = {
            "tds_rise_rate_ppm_per_min": tds_rise_rate,
            "tds_absolute_delta": tds_delta,
            "tds_peak_to_baseline_ratio": tds_peak / max(tds_baseline_val, 1),
            "time_of_spike_hour": spike_hour,
            "duration_of_elevation_minutes": duration_minutes,
            "temperature_delta_at_spike": temp_delta,
            "turbidity_correlated_with_tds": 1.0 if turb_tds_corr else 0.0,
            "ph_drop_at_spike": ph_drop,
            "flow_anomaly_at_spike": 1.0 if flow_anomaly else 0.0,
            "humidity_at_spike": humidity_at_spike,
            "rain_in_previous_4hr": 1.0 if rain_4hr else 0.0,
            "spike_pattern_type": spike_pattern,
        }

        result = self.classifier.predict(features)
        source = result["source"]
        confidence = result["confidence"]

        if confidence < 0.6:
            source = "unknown"

        contamination_start = None
        if tds_rise_rate > 0:
            offset_minutes = tds_delta / max(tds_rise_rate, 0.01)
            contamination_start = (reading.timestamp or datetime.utcnow()) - timedelta(minutes=offset_minutes)

        upstream_km = self._estimate_upstream_distance(tds_rise_rate)

        source_enum = ContaminationSource(source)

        report = ForensicsReport(
            id=uuid.uuid4(),
            village_id=reading.village_id,
            outbreak_prediction_id=prediction.id,
            generated_at=datetime.utcnow(),
            contamination_source=source_enum,
            source_confidence=confidence,
            contamination_start_timestamp=contamination_start,
            upstream_distance_km=upstream_km,
            tds_baseline=tds_baseline_val,
            tds_peak=tds_peak,
            tds_rise_rate=tds_rise_rate,
            pattern_signature={
                "spike_pattern": spike_pattern,
                "turbidity_correlated": turb_tds_corr,
                "ph_drop": ph_drop,
                "flow_anomaly": flow_anomaly,
                "rain_recent": rain_4hr,
            },
            supporting_evidence={
                "features_used": features,
                "classifier_output": result,
                "readings_analyzed": len(recent_readings),
                "baseline_readings": len(baseline_readings),
            },
        )

        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)

        await ws_manager.broadcast_forensics(
            village_id=str(reading.village_id),
            source=source,
            confidence=confidence * 100,
        )

        return report

    def _estimate_upstream_distance(self, rise_rate: float) -> float:
        if rise_rate <= 0:
            return 0.0
        if rise_rate > 50:
            return 0.5
        elif rise_rate > 20:
            return 1.5
        elif rise_rate > 10:
            return 3.0
        elif rise_rate > 5:
            return 5.0
        elif rise_rate > 2:
            return 8.0
        else:
            return 12.0

    async def get_reports_for_village(self, village_id, limit: int = 50) -> List[ForensicsReport]:
        result = await self.db.execute(
            select(ForensicsReport)
            .where(ForensicsReport.village_id == village_id)
            .order_by(desc(ForensicsReport.generated_at))
            .limit(limit)
        )
        return result.scalars().all()

    async def get_report_by_id(self, report_id) -> Optional[ForensicsReport]:
        result = await self.db.execute(
            select(ForensicsReport).where(ForensicsReport.id == report_id)
        )
        return result.scalar_one_or_none()
