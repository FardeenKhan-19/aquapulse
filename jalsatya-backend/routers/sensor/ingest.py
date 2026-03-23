from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from core.dependencies import get_sensor_node, get_redis
from models.sensor_node import SensorNode
from models.village import Village
from schemas.sensor_reading import SensorReadingCreate, SensorReadingAccepted
from services.sensor_service import SensorService
from datetime import datetime
import redis.asyncio as aioredis

router = APIRouter(prefix="/api/sensors", tags=["Sensor Ingest"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.post("/reading")
async def submit_reading(
    reading_data: SensorReadingCreate,
    sensor: SensorNode = Depends(get_sensor_node),
    db: AsyncSession = Depends(get_db),
    redis_client: aioredis.Redis = Depends(get_redis),
):
    sensor_service = SensorService(db, redis_client)

    reading = await sensor_service.ingest_reading(
        sensor_node=sensor,
        reading_data=reading_data.model_dump(),
    )

    return _envelope(data={
        "status": "accepted",
        "reading_id": str(reading.id),
    })


@router.get("/me")
async def get_sensor_config(
    sensor: SensorNode = Depends(get_sensor_node),
    db: AsyncSession = Depends(get_db),
):
    village_result = await db.execute(select(Village).where(Village.id == sensor.village_id))
    village = village_result.scalar_one_or_none()

    return _envelope(data={
        "sensor_id": str(sensor.id),
        "hardware_id": sensor.hardware_id,
        "name": sensor.name,
        "village_id": str(sensor.village_id),
        "village_name": village.name if village else None,
        "sensor_types": sensor.sensor_types,
        "calibration_data": sensor.calibration_data,
        "deployment_date": sensor.deployment_date.isoformat() if sensor.deployment_date else None,
        "firmware_update_available": False,
        "config": {
            "report_interval_seconds": 30,
            "calibration_interval_hours": 24,
        },
    })
