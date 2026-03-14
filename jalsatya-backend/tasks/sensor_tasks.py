from tasks.celery_app import celery_app
from database import SyncSessionLocal
from models.sensor_node import SensorNode
from models.village import Village
from models.sensor_reading import SensorReading
from models.alert import Alert, AlertType, AlertSeverity
from services.mock_sensor_service import generate_reading, HEALTHY_PROFILES, WARNING_PROFILES, CRITICAL_PROFILES
from config import settings
from loguru import logger
from datetime import datetime, timedelta
from sqlalchemy import select, and_
import uuid


@celery_app.task(name="tasks.sensor_tasks.generate_mock_readings")
def generate_mock_readings():
    if settings.SENSOR_MODE != "mock":
        return "Skipped: not in mock mode"

    db = SyncSessionLocal()
    try:
        sensors = db.execute(
            select(SensorNode).where(
                and_(SensorNode.is_active == True, SensorNode.is_approved == True)
            )
        ).scalars().all()

        if not sensors:
            return "No active sensors"

        profiles = [HEALTHY_PROFILES, WARNING_PROFILES, CRITICAL_PROFILES]
        now = datetime.utcnow()
        count = 0

        for idx, sensor in enumerate(sensors):
            profile = profiles[idx % len(profiles)]
            add_spike = (idx % 3 == 2)

            data = generate_reading(profile, now, add_spike=add_spike)

            reading = SensorReading(
                id=uuid.uuid4(),
                sensor_node_id=sensor.id,
                village_id=sensor.village_id,
                timestamp=now,
                tds_ppm=data.get("tds_ppm"),
                temperature_c=data.get("temperature_c"),
                turbidity_ntu=data.get("turbidity_ntu"),
                ph=data.get("ph"),
                humidity_pct=data.get("humidity_pct"),
                flow_rate_lpm=data.get("flow_rate_lpm"),
                raw_payload=data,
                is_anomaly=False,
                anomaly_score=0,
            )
            db.add(reading)

            sensor.last_seen = now
            count += 1

        db.commit()
        logger.info(f"Generated {count} mock readings")
        return f"Generated {count} readings"

    except Exception as e:
        db.rollback()
        logger.error(f"Mock reading generation failed: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="tasks.sensor_tasks.check_sensor_offline")
def check_sensor_offline():
    db = SyncSessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(minutes=10)
        sensors = db.execute(
            select(SensorNode).where(
                and_(
                    SensorNode.is_active == True,
                    SensorNode.is_approved == True,
                    SensorNode.last_seen < cutoff,
                )
            )
        ).scalars().all()

        for sensor in sensors:
            existing = db.execute(
                select(Alert).where(
                    and_(
                        Alert.related_sensor_id == sensor.id,
                        Alert.alert_type == AlertType.sensor_offline,
                        Alert.is_acknowledged == False,
                    )
                )
            ).scalar_one_or_none()

            if not existing:
                village = db.execute(
                    select(Village).where(Village.id == sensor.village_id)
                ).scalar_one_or_none()
                village_name = village.name if village else "Unknown"

                alert = Alert(
                    id=uuid.uuid4(),
                    village_id=sensor.village_id,
                    alert_type=AlertType.sensor_offline,
                    severity=AlertSeverity.medium,
                    message=f"📡 Sensor {sensor.name} in {village_name} offline since {sensor.last_seen}",
                    related_sensor_id=sensor.id,
                    is_acknowledged=False,
                    created_at=datetime.utcnow(),
                )
                db.add(alert)

        db.commit()
        logger.info(f"Checked sensor status: {len(sensors)} offline")
        return f"{len(sensors)} offline sensors found"

    except Exception as e:
        db.rollback()
        logger.error(f"Sensor offline check failed: {e}")
        raise
    finally:
        db.close()
