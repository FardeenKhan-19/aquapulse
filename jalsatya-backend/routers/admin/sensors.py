from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from database import get_db
from core.dependencies import get_current_admin
from models.user import User
from models.sensor_node import SensorNode
from models.sensor_reading import SensorReading
from models.village import Village
from schemas.sensor_node import SensorNodeCreate, SensorNodeUpdate, SensorNodeResponse, SensorNodeCreateResponse, CalibrateRequest
from core.security import generate_api_key, hash_api_key
from services.qr_service import QRService
from datetime import datetime
import uuid
import math

router = APIRouter(prefix="/api/admin/sensors", tags=["Admin - Sensors"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.post("")
async def register_sensor(
    sensor_data: SensorNodeCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    existing = await db.execute(select(SensorNode).where(SensorNode.hardware_id == sensor_data.hardware_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Hardware ID already registered")

    village_result = await db.execute(select(Village).where(Village.id == sensor_data.village_id))
    if not village_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Village not found")

    api_key = generate_api_key()
    api_key_hashed = hash_api_key(api_key)

    sensor = SensorNode(
        id=uuid.uuid4(),
        hardware_id=sensor_data.hardware_id,
        name=sensor_data.name,
        village_id=sensor_data.village_id,
        gps_lat=sensor_data.gps_lat,
        gps_lng=sensor_data.gps_lng,
        api_key=api_key,
        api_key_hash=api_key_hashed,
        sensor_types=sensor_data.sensor_types,
        is_active=True,
        is_approved=False,
        deployment_date=sensor_data.deployment_date,
        registered_by=admin.id,
        created_at=datetime.utcnow(),
    )
    db.add(sensor)
    await db.commit()
    await db.refresh(sensor)

    qr_b64 = QRService.generate_sensor_qr(api_key)

    return _envelope(data={
        "sensor_id": str(sensor.id),
        "api_key": api_key,
        "qr_code_base64": qr_b64,
        "qr_code_url": None,
        "message": "API key shown once. Store securely.",
    })


@router.get("")
async def list_sensors(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    total_result = await db.execute(select(func.count(SensorNode.id)))
    total = total_result.scalar()

    result = await db.execute(
        select(SensorNode)
        .order_by(SensorNode.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    sensors = result.scalars().all()

    items = []
    for s in sensors:
        item = SensorNodeResponse.model_validate(s).model_dump(mode="json")
        item["status"] = "online" if s.last_seen and (datetime.utcnow() - s.last_seen).total_seconds() < 600 else "offline"
        items.append(item)

    return _envelope(data={
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total else 0,
    })


@router.get("/{sensor_id}")
async def get_sensor(
    sensor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(SensorNode).where(SensorNode.id == sensor_id))
    sensor = result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    readings_result = await db.execute(
        select(SensorReading)
        .where(SensorReading.sensor_node_id == sensor_id)
        .order_by(desc(SensorReading.timestamp))
        .limit(10)
    )
    readings = readings_result.scalars().all()

    sensor_data = SensorNodeResponse.model_validate(sensor).model_dump(mode="json")
    sensor_data["recent_readings"] = [
        {
            "id": str(r.id),
            "timestamp": r.timestamp.isoformat() + "Z",
            "tds_ppm": float(r.tds_ppm) if r.tds_ppm else None,
            "temperature_c": float(r.temperature_c) if r.temperature_c else None,
            "turbidity_ntu": float(r.turbidity_ntu) if r.turbidity_ntu else None,
            "ph": float(r.ph) if r.ph else None,
            "is_anomaly": r.is_anomaly,
        }
        for r in readings
    ]

    return _envelope(data=sensor_data)


@router.put("/{sensor_id}")
async def update_sensor(
    sensor_id: uuid.UUID,
    sensor_data: SensorNodeUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(SensorNode).where(SensorNode.id == sensor_id))
    sensor = result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    update_dict = sensor_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(sensor, key, value)

    await db.commit()
    await db.refresh(sensor)

    return _envelope(data=SensorNodeResponse.model_validate(sensor).model_dump(mode="json"))


@router.delete("/{sensor_id}")
async def delete_sensor(
    sensor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(SensorNode).where(SensorNode.id == sensor_id))
    sensor = result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    sensor.is_active = False
    await db.commit()

    return _envelope(message="Sensor deactivated")


@router.post("/{sensor_id}/approve")
async def approve_sensor(
    sensor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(SensorNode).where(SensorNode.id == sensor_id))
    sensor = result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    sensor.is_approved = True
    await db.commit()
    await db.refresh(sensor)

    return _envelope(data=SensorNodeResponse.model_validate(sensor).model_dump(mode="json"), message="Sensor approved")


@router.post("/{sensor_id}/calibrate")
async def calibrate_sensor(
    sensor_id: uuid.UUID,
    request: CalibrateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(SensorNode).where(SensorNode.id == sensor_id))
    sensor = result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    sensor.calibration_data = request.calibration_data
    await db.commit()
    await db.refresh(sensor)

    return _envelope(data=SensorNodeResponse.model_validate(sensor).model_dump(mode="json"), message="Calibration updated")


@router.get("/{sensor_id}/qr")
async def get_sensor_qr(
    sensor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(SensorNode).where(SensorNode.id == sensor_id))
    sensor = result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")

    village_result = await db.execute(select(Village).where(Village.id == sensor.village_id))
    village = village_result.scalar_one_or_none()
    village_name = village.name if village else "Unknown"

    pdf_bytes = QRService.generate_qr_pdf(
        api_key=sensor.api_key,
        sensor_name=sensor.name,
        village_name=village_name,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=sensor_{sensor.hardware_id}_qr.pdf"},
    )
