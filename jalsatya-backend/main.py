import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from loguru import logger
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from config import settings
from database import async_engine, Base, AsyncSessionLocal
from core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from core.rate_limiter import limiter
from core.websocket_manager import ws_manager

from routers.auth import router as auth_router
from routers.admin.users import router as admin_users_router
from routers.admin.sensors import router as admin_sensors_router
from routers.admin.villages import router as admin_villages_router
from routers.admin.system import router as admin_system_router
from routers.health_officer.dashboard import router as ho_dashboard_router
from routers.health_officer.alerts import router as ho_alerts_router
from routers.health_officer.reports import router as ho_reports_router
from routers.sensor.ingest import router as sensor_ingest_router
from routers.predictions import router as predictions_router
from routers.forensics import router as forensics_router
from routers.legal import router as legal_router
from routers.alerts import router as alerts_router
from routers.chatbot import router as chatbot_router
from routers.analytics import router as analytics_router
from routers.websocket import router as websocket_router
from routers.demo import router as demo_router

logger.remove()
logger.add(sys.stdout, level="INFO", format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}")
logger.add("aquapulse.log", rotation="10 MB", retention="7 days", level="DEBUG")


async def seed_database():
    from sqlalchemy import select, func
    from models.user import User, UserRole
    from models.village import Village
    from models.sensor_node import SensorNode
    from models.demo_scenario import DemoScenario
    from core.security import get_password_hash, generate_api_key, hash_api_key
    from services.mock_sensor_service import seed_villages, generate_historical_data
    import uuid

    async with AsyncSessionLocal() as db:
        user_count = await db.execute(select(func.count(User.id)))
        if user_count.scalar() > 0:
            logger.info("Database already seeded, skipping.")
            return

        logger.info("Seeding database...")

        admin = User(
            id=uuid.uuid4(),
            email=settings.ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            full_name=settings.ADMIN_FULL_NAME,
            role=UserRole.admin,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(admin)
        await db.flush()
        logger.info(f"Admin user created: {settings.ADMIN_EMAIL}")

        villages = await seed_villages(db)

        sensors = []
        demo_village_names = ["Dharangaon", "Yawal", "Raver"]
        demo_villages = [v for v in villages if v.name in demo_village_names]

        for idx, village in enumerate(demo_villages):
            if idx == 0:
                api_key = "018a11d4-ad52-455e-924e-86d46ad11b5e"
            else:
                api_key = generate_api_key()
            sensor = SensorNode(
                id=uuid.uuid4(),
                hardware_id=f"JS-SENSOR-{idx+1:03d}",
                name=f"Sensor Node {village.name}",
                village_id=village.id,
                gps_lat=village.gps_lat,
                gps_lng=village.gps_lng,
                api_key=api_key,
                api_key_hash=hash_api_key(api_key),
                sensor_types=["tds", "temperature", "turbidity", "ph", "humidity", "flow"],
                is_active=True,
                is_approved=True,
                deployment_date=datetime.utcnow().date(),
                registered_by=admin.id,
                created_at=datetime.utcnow(),
                last_seen=datetime.utcnow(),
            )
            db.add(sensor)
            sensors.append(sensor)

        await db.flush()
        logger.info(f"Created {len(sensors)} mock sensor nodes")

        for idx, (number, name, village) in enumerate([
            (1, "Dharangaon Cholera Outbreak", demo_villages[0] if len(demo_villages) > 0 else None),
            (2, "Early Detection Timeline", demo_villages[1] if len(demo_villages) > 1 else None),
            (3, "Intervention Success", demo_villages[2] if len(demo_villages) > 2 else None),
        ]):
            if village:
                scenario = DemoScenario(
                    id=uuid.uuid4(),
                    scenario_number=number,
                    name=name,
                    village_id=village.id,
                    is_active=False,
                )
                db.add(scenario)

        await db.commit()
        logger.info("Demo scenarios created")

        await generate_historical_data(db, villages, sensors, hours=24)
        logger.info("Database seeding complete!")


async def train_models_if_needed():
    from ml.model_trainer import ensure_models_trained
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, ensure_models_trained)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} ({settings.APP_ENV})")
    logger.info(f"Sensor mode: {settings.SENSOR_MODE}")

    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

    try:
        await seed_database()
    except Exception as e:
        logger.error(f"Database seeding failed: {e}")

    try:
        asyncio.create_task(train_models_if_needed())
        logger.info("Model training scheduled in background.")
    except Exception as e:
        logger.error(f"Model training scheduling failed: {e}")

    logger.info(f"{settings.APP_NAME} is ready!")

    yield

    await async_engine.dispose()
    logger.info(f"{settings.APP_NAME} shut down.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Water-borne disease outbreak prediction + contamination source forensics + automatic legal evidence filing.",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "X-Sensor-Key"],
)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(auth_router)
app.include_router(admin_users_router)
app.include_router(admin_sensors_router)
app.include_router(admin_villages_router)
app.include_router(admin_system_router)
app.include_router(ho_dashboard_router)
app.include_router(ho_alerts_router)
app.include_router(ho_reports_router)
app.include_router(sensor_ingest_router)
app.include_router(predictions_router)
app.include_router(forensics_router)
app.include_router(legal_router)
app.include_router(alerts_router)
app.include_router(chatbot_router)
app.include_router(analytics_router)
app.include_router(websocket_router)
app.include_router(demo_router)

v1_app = FastAPI(title=f"{settings.APP_NAME} v1")
v1_app.include_router(auth_router)
v1_app.include_router(admin_users_router)
v1_app.include_router(admin_sensors_router)
v1_app.include_router(admin_villages_router)
v1_app.include_router(admin_system_router)
v1_app.include_router(ho_dashboard_router)
v1_app.include_router(ho_alerts_router)
v1_app.include_router(ho_reports_router)
v1_app.include_router(sensor_ingest_router)
v1_app.include_router(predictions_router)
v1_app.include_router(forensics_router)
v1_app.include_router(legal_router)
v1_app.include_router(alerts_router)
v1_app.include_router(chatbot_router)
v1_app.include_router(analytics_router)
v1_app.include_router(websocket_router)
v1_app.include_router(demo_router)

app.mount("/api/v1", v1_app)


@app.get("/health")
async def health_check():
    db_status = "ok"
    redis_status = "ok"

    try:
        from database import async_engine
        from sqlalchemy import text
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    try:
        from core.dependencies import get_redis
        redis_client = await get_redis()
        if redis_client:
            await redis_client.ping()
    except Exception:
        redis_status = "unknown"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "db": db_status,
        "redis": redis_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "message": "Internal server error",
            "error_code": "INTERNAL_ERROR",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "data": None,
            "message": "Resource not found",
            "error_code": "NOT_FOUND",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    )


@app.exception_handler(422)
async def validation_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "data": None,
            "message": "Validation error",
            "error_code": "VALIDATION_ERROR",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    )
