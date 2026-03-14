from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, desc
from database import get_db
from core.dependencies import get_current_admin, get_redis
from models.user import User
from models.village import Village
from models.sensor_node import SensorNode
from models.sensor_reading import SensorReading
from models.outbreak_prediction import OutbreakPrediction, RiskLevel
from models.forensics_report import ForensicsReport, ContaminationSource
from models.demo_scenario import DemoScenario
from models.alert import Alert
from services.outbreak_service import OutbreakService
from services.forensics_service import ForensicsService
from services.legal_service import LegalService
from services.alert_service import AlertService
from services.mock_sensor_service import generate_spike_sequence, generate_recovery_sequence, HEALTHY_PROFILES, WARNING_PROFILES, CRITICAL_PROFILES
from core.websocket_manager import ws_manager
from datetime import datetime, timedelta
from loguru import logger
import redis.asyncio as aioredis
import uuid
import asyncio

router = APIRouter(prefix="/api/demo", tags=["Demo Scenarios"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.post("/scenario/1")
async def scenario_1_cholera_outbreak(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    village_result = await db.execute(select(Village).where(Village.name == "Dharangaon").limit(1))
    village = village_result.scalar_one_or_none()
    if not village:
        raise HTTPException(status_code=404, detail="Dharangaon village not found. Run seeding first.")

    sensor_result = await db.execute(select(SensorNode).where(SensorNode.village_id == village.id).limit(1))
    sensor = sensor_result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="No sensor found for Dharangaon")

    await ws_manager.broadcast_demo_scenario(1, "started")

    spike_readings = generate_spike_sequence(
        base_profile=HEALTHY_PROFILES,
        start_time=datetime.utcnow() - timedelta(hours=2),
        peak_tds=920,
        duration_minutes=120,
        interval_seconds=60,
    )

    critical_reading = None
    for data in spike_readings[-10:]:
        reading = SensorReading(
            id=uuid.uuid4(),
            sensor_node_id=sensor.id,
            village_id=village.id,
            timestamp=datetime.utcnow(),
            tds_ppm=data.get("tds_ppm"),
            temperature_c=data.get("temperature_c"),
            turbidity_ntu=data.get("turbidity_ntu"),
            ph=data.get("ph"),
            humidity_pct=data.get("humidity_pct"),
            flow_rate_lpm=data.get("flow_rate_lpm"),
            raw_payload=data,
            is_anomaly=True,
            anomaly_score=3.5,
        )
        db.add(reading)
        critical_reading = reading

    await db.flush()

    outbreak_service = OutbreakService(db)
    prediction = await outbreak_service.run_prediction(critical_reading, village)

    forensics_service = ForensicsService(db)
    forensics = await forensics_service.analyze_contamination(critical_reading, prediction)

    alert_service = AlertService(db)
    await alert_service.create_outbreak_alert(prediction, village)
    await alert_service.create_contamination_alert(forensics, village)

    legal_service = LegalService(db)
    try:
        documents = await legal_service.generate_legal_documents(forensics, village, prediction)
        for doc in documents:
            if doc.filing_reference:
                await alert_service.create_legal_filed_alert(village, doc.filing_reference)
    except Exception as e:
        logger.warning(f"Legal document generation failed in demo: {e}")
        documents = []

    scenario = await db.execute(select(DemoScenario).where(DemoScenario.scenario_number == 1))
    demo = scenario.scalar_one_or_none()
    if demo:
        demo.is_active = True
        demo.triggered_at = datetime.utcnow()
        demo.triggered_by = admin.id
    else:
        demo = DemoScenario(
            id=uuid.uuid4(),
            scenario_number=1,
            name="Dharangaon Cholera Outbreak",
            village_id=village.id,
            is_active=True,
            triggered_at=datetime.utcnow(),
            triggered_by=admin.id,
        )
        db.add(demo)

    await db.commit()
    await ws_manager.broadcast_demo_scenario(1, "completed")

    return _envelope(data={
        "scenario": "Dharangaon Cholera Outbreak",
        "village": village.name,
        "prediction_risk_score": float(prediction.risk_score),
        "prediction_risk_level": prediction.risk_level.value if hasattr(prediction.risk_level, 'value') else str(prediction.risk_level),
        "forensics_source": forensics.contamination_source.value if hasattr(forensics.contamination_source, 'value') else str(forensics.contamination_source),
        "forensics_confidence": float(forensics.source_confidence) if forensics.source_confidence else 0,
        "legal_documents_generated": len(documents),
    })


@router.post("/scenario/2")
async def scenario_2_early_detection(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    village_result = await db.execute(select(Village).where(Village.name == "Yawal").limit(1))
    village = village_result.scalar_one_or_none()
    if not village:
        raise HTTPException(status_code=404, detail="Yawal village not found")

    sensor_result = await db.execute(select(SensorNode).where(SensorNode.village_id == village.id).limit(1))
    sensor = sensor_result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="No sensor found for Yawal")

    await ws_manager.broadcast_demo_scenario(2, "started")

    now = datetime.utcnow()
    tds_progression = [250, 280, 310, 350, 400, 460, 530, 610, 700, 780]

    readings = []
    for i, tds in enumerate(tds_progression):
        reading = SensorReading(
            id=uuid.uuid4(),
            sensor_node_id=sensor.id,
            village_id=village.id,
            timestamp=now - timedelta(hours=72 - i * 8),
            tds_ppm=tds,
            temperature_c=29 + i * 0.3,
            turbidity_ntu=5 + i * 2,
            ph=7.2 - i * 0.12,
            humidity_pct=65 + i * 2,
            flow_rate_lpm=4.0 - i * 0.1,
            raw_payload={"tds_ppm": tds, "demo": True},
            is_anomaly=i >= 5,
            anomaly_score=i * 0.5,
        )
        db.add(reading)
        readings.append(reading)

    await db.flush()

    outbreak_service = OutbreakService(db)
    medium_reading = readings[5]
    prediction = await outbreak_service.run_prediction(medium_reading, village)

    alert_service = AlertService(db)
    await alert_service.create_outbreak_alert(prediction, village)

    scenario = await db.execute(select(DemoScenario).where(DemoScenario.scenario_number == 2))
    demo = scenario.scalar_one_or_none()
    if demo:
        demo.is_active = True
        demo.triggered_at = datetime.utcnow()
        demo.triggered_by = admin.id
    else:
        demo = DemoScenario(
            id=uuid.uuid4(),
            scenario_number=2,
            name="Early Detection Timeline",
            village_id=village.id,
            is_active=True,
            triggered_at=datetime.utcnow(),
            triggered_by=admin.id,
        )
        db.add(demo)

    await db.commit()
    await ws_manager.broadcast_demo_scenario(2, "completed")

    return _envelope(data={
        "scenario": "Early Detection Timeline",
        "village": village.name,
        "detection_at_tds": 460,
        "detection_risk_level": "medium",
        "cases_prevented": 47,
        "cost_saved": "₹12.4L",
        "timeline_hours": 72,
    })


@router.post("/scenario/3")
async def scenario_3_intervention_success(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    village_result = await db.execute(select(Village).where(Village.name == "Yawal").limit(1))
    village = village_result.scalar_one_or_none()
    if not village:
        village_result = await db.execute(select(Village).limit(1))
        village = village_result.scalar_one_or_none()
    if not village:
        raise HTTPException(status_code=404, detail="No village found")

    sensor_result = await db.execute(select(SensorNode).where(SensorNode.village_id == village.id).limit(1))
    sensor = sensor_result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="No sensor found")

    await ws_manager.broadcast_demo_scenario(3, "started")

    recovery_data = generate_recovery_sequence(
        base_profile=HEALTHY_PROFILES,
        start_time=datetime.utcnow() - timedelta(hours=24),
        duration_hours=24,
        interval_seconds=600,
    )

    for data in recovery_data[-20:]:
        reading = SensorReading(
            id=uuid.uuid4(),
            sensor_node_id=sensor.id,
            village_id=village.id,
            timestamp=datetime.utcnow(),
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

    scenario = await db.execute(select(DemoScenario).where(DemoScenario.scenario_number == 3))
    demo = scenario.scalar_one_or_none()
    if demo:
        demo.is_active = True
        demo.triggered_at = datetime.utcnow()
        demo.triggered_by = admin.id
    else:
        demo = DemoScenario(
            id=uuid.uuid4(),
            scenario_number=3,
            name="Intervention Success",
            village_id=village.id,
            is_active=True,
            triggered_at=datetime.utcnow(),
            triggered_by=admin.id,
        )
        db.add(demo)

    await db.commit()
    await ws_manager.broadcast_demo_scenario(3, "completed")

    return _envelope(data={
        "scenario": "Intervention Success",
        "village": village.name,
        "recovery_status": "complete",
        "tds_normalized": True,
        "legal_case_status": "filed → acknowledged",
        "roi": "14x return on device cost",
        "device_cost": "₹8,500",
        "savings": "₹1,19,000",
    })


@router.get("/reset")
async def reset_demos(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    await db.execute(
        update(DemoScenario).values(is_active=False)
    )
    await db.commit()

    return _envelope(message="All demo scenarios reset to baseline")
