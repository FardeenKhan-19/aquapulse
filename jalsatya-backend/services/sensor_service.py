from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from models.sensor_reading import SensorReading
from models.sensor_node import SensorNode
from models.village import Village
from core.websocket_manager import ws_manager
from config import settings
import redis.asyncio as aioredis
import numpy as np
from loguru import logger
import uuid


class SensorService:
    def __init__(self, db: AsyncSession, redis_client: aioredis.Redis):
        self.db = db
        self.redis = redis_client

    async def ingest_reading(
        self,
        sensor_node: SensorNode,
        reading_data: Dict[str, Any],
    ) -> SensorReading:
        reading = SensorReading(
            id=uuid.uuid4(),
            sensor_node_id=sensor_node.id,
            village_id=sensor_node.village_id,
            timestamp=reading_data.get("timestamp", datetime.utcnow()),
            tds_ppm=reading_data.get("tds_ppm"),
            temperature_c=reading_data.get("temperature_c"),
            turbidity_ntu=reading_data.get("turbidity_ntu"),
            ph=reading_data.get("ph"),
            humidity_pct=reading_data.get("humidity_pct"),
            flow_rate_lpm=reading_data.get("flow_rate_lpm"),
            raw_payload=reading_data,
            is_anomaly=False,
            anomaly_score=0.0,
        )

        self.db.add(reading)

        sensor_node.last_seen = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(reading)

        await self.redis.setex(
            f"sensor_rate:{str(sensor_node.id)}",
            settings.SENSOR_RATE_LIMIT_SECONDS,
            "1",
        )

        is_anomaly, anomaly_score = await self._detect_anomaly(reading, sensor_node.village_id)
        if is_anomaly:
            reading.is_anomaly = True
            reading.anomaly_score = anomaly_score
            await self.db.commit()

        await ws_manager.broadcast_sensor_reading(
            village_id=str(sensor_node.village_id),
            sensor_node_id=str(sensor_node.id),
            data={
                "reading_id": str(reading.id),
                "tds_ppm": float(reading.tds_ppm) if reading.tds_ppm else None,
                "temperature_c": float(reading.temperature_c) if reading.temperature_c else None,
                "turbidity_ntu": float(reading.turbidity_ntu) if reading.turbidity_ntu else None,
                "ph": float(reading.ph) if reading.ph else None,
                "humidity_pct": float(reading.humidity_pct) if reading.humidity_pct else None,
                "flow_rate_lpm": float(reading.flow_rate_lpm) if reading.flow_rate_lpm else None,
                "timestamp": reading.timestamp.isoformat() + "Z",
                "is_anomaly": reading.is_anomaly,
            },
        )

        return reading

    async def _detect_anomaly(self, reading: SensorReading, village_id) -> Tuple[bool, float]:
        cutoff = datetime.utcnow() - timedelta(hours=48)
        result = await self.db.execute(
            select(SensorReading)
            .where(
                and_(
                    SensorReading.village_id == village_id,
                    SensorReading.timestamp >= cutoff,
                )
            )
            .order_by(desc(SensorReading.timestamp))
            .limit(500)
        )
        historical = result.scalars().all()

        if len(historical) < 10:
            return False, 0.0

        tds_values = [float(r.tds_ppm) for r in historical if r.tds_ppm is not None]
        if not tds_values or reading.tds_ppm is None:
            return False, 0.0

        mean_tds = np.mean(tds_values)
        std_tds = np.std(tds_values) if len(tds_values) > 1 else 1.0
        if std_tds < 1.0:
            std_tds = 1.0

        z_score_tds = abs(float(reading.tds_ppm) - mean_tds) / std_tds

        anomaly_scores = [z_score_tds]

        if reading.turbidity_ntu is not None:
            turb_values = [float(r.turbidity_ntu) for r in historical if r.turbidity_ntu is not None]
            if turb_values:
                mean_turb = np.mean(turb_values)
                std_turb = max(np.std(turb_values), 1.0)
                z_turb = abs(float(reading.turbidity_ntu) - mean_turb) / std_turb
                anomaly_scores.append(z_turb)

        if reading.ph is not None:
            ph_values = [float(r.ph) for r in historical if r.ph is not None]
            if ph_values:
                mean_ph = np.mean(ph_values)
                std_ph = max(np.std(ph_values), 0.1)
                z_ph = abs(float(reading.ph) - mean_ph) / std_ph
                anomaly_scores.append(z_ph)

        max_z = max(anomaly_scores)
        combined_score = float(np.mean(anomaly_scores))

        is_anomaly = max_z > 2.5 or combined_score > 2.0

        return is_anomaly, combined_score

    async def get_village_readings(
        self, village_id, limit: int = 200, offset: int = 0
    ) -> Tuple[List[SensorReading], int]:
        count_result = await self.db.execute(
            select(func.count(SensorReading.id)).where(SensorReading.village_id == village_id)
        )
        total = count_result.scalar()

        result = await self.db.execute(
            select(SensorReading)
            .where(SensorReading.village_id == village_id)
            .order_by(desc(SensorReading.timestamp))
            .limit(limit)
            .offset(offset)
        )
        readings = result.scalars().all()
        return readings, total

    async def get_village_baseline(self, village_id, hours: int = 48) -> Dict[str, float]:
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        result = await self.db.execute(
            select(SensorReading)
            .where(
                and_(
                    SensorReading.village_id == village_id,
                    SensorReading.timestamp >= cutoff,
                )
            )
        )
        readings = result.scalars().all()

        if not readings:
            return {"tds_median": 250, "turb_median": 5, "ph_median": 7.0, "temp_median": 28}

        tds = [float(r.tds_ppm) for r in readings if r.tds_ppm is not None]
        turb = [float(r.turbidity_ntu) for r in readings if r.turbidity_ntu is not None]
        ph = [float(r.ph) for r in readings if r.ph is not None]
        temp = [float(r.temperature_c) for r in readings if r.temperature_c is not None]

        return {
            "tds_median": float(np.median(tds)) if tds else 250,
            "turb_median": float(np.median(turb)) if turb else 5,
            "ph_median": float(np.median(ph)) if ph else 7.0,
            "temp_median": float(np.median(temp)) if temp else 28,
        }

    async def check_sensor_offline(self):
        cutoff = datetime.utcnow() - timedelta(minutes=10)
        result = await self.db.execute(
            select(SensorNode).where(
                and_(
                    SensorNode.is_active == True,
                    SensorNode.is_approved == True,
                    SensorNode.last_seen < cutoff,
                )
            )
        )
        offline_sensors = result.scalars().all()

        for sensor in offline_sensors:
            await ws_manager.broadcast_sensor_offline(
                sensor_node_id=str(sensor.id),
                village_id=str(sensor.village_id),
                last_seen=sensor.last_seen.isoformat() + "Z" if sensor.last_seen else "never",
            )
            logger.warning(f"Sensor {sensor.name} ({sensor.id}) offline since {sensor.last_seen}")

        return offline_sensors
