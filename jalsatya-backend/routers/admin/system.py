from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from database import get_db, async_engine
from core.dependencies import get_current_admin, get_redis
from core.websocket_manager import ws_manager
from models.user import User
from models.legal_document import LegalDocument
from ml.outbreak_model import OutbreakPredictor
from ml.forensics_model import ForensicsClassifier
from ml.model_trainer import retrain_all_models
from config import settings
from datetime import datetime, timedelta
import redis.asyncio as aioredis
from loguru import logger

router = APIRouter(prefix="/api/admin/system", tags=["Admin - System"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.get("/health")
async def system_health(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
    redis_client: aioredis.Redis = Depends(get_redis),
):
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    redis_status = "ok"
    try:
        await redis_client.ping()
    except Exception as e:
        redis_status = f"error: {str(e)}"

    celery_status = "unknown"
    try:
        from tasks.celery_app import celery_app
        inspector = celery_app.control.inspect()
        active = inspector.active()
        celery_status = "ok" if active else "no workers"
    except Exception:
        celery_status = "unavailable"

    return _envelope(data={
        "status": "ok" if db_status == "ok" and redis_status == "ok" else "degraded",
        "db": db_status,
        "redis": redis_status,
        "celery": celery_status,
        "websocket_connections": ws_manager.active_connections_count,
        "environment": settings.APP_ENV,
        "sensor_mode": settings.SENSOR_MODE,
    })


@router.get("/api-usage")
async def api_usage(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    cutoff = datetime.utcnow() - timedelta(days=30)
    result = await db.execute(
        select(
            func.date_trunc("day", LegalDocument.generated_at).label("day"),
            func.sum(LegalDocument.prompt_tokens_used).label("prompt_tokens"),
            func.sum(LegalDocument.completion_tokens_used).label("completion_tokens"),
            func.count(LegalDocument.id).label("documents"),
        )
        .where(LegalDocument.generated_at >= cutoff)
        .group_by(func.date_trunc("day", LegalDocument.generated_at))
        .order_by(func.date_trunc("day", LegalDocument.generated_at).desc())
    )
    rows = result.all()

    usage = [
        {
            "date": row.day.isoformat() if row.day else None,
            "prompt_tokens": int(row.prompt_tokens or 0),
            "completion_tokens": int(row.completion_tokens or 0),
            "total_tokens": int((row.prompt_tokens or 0) + (row.completion_tokens or 0)),
            "documents_generated": int(row.documents or 0),
        }
        for row in rows
    ]

    return _envelope(data={"usage_by_day": usage, "model": settings.CLAUDE_MODEL})


@router.get("/model-info")
async def model_info(
    admin: User = Depends(get_current_admin),
):
    predictor = OutbreakPredictor()
    predictor.load_model()
    outbreak_info = predictor.get_model_info()

    classifier = ForensicsClassifier()
    classifier.load_model()
    forensics_info = classifier.get_model_info()

    return _envelope(data={
        "outbreak_model": outbreak_info,
        "forensics_model": forensics_info,
    })


@router.post("/retrain")
async def retrain_models(
    admin: User = Depends(get_current_admin),
):
    try:
        result = retrain_all_models()
        return _envelope(data=result, message="Models retrained successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")


@router.get("/logs")
async def get_logs(
    admin: User = Depends(get_current_admin),
    lines: int = 500,
):
    import os
    log_file = "aquapulse.log"
    log_lines = []

    if os.path.exists(log_file):
        with open(log_file, "r") as f:
            all_lines = f.readlines()
            log_lines = all_lines[-lines:]
    else:
        log_lines = ["No log file found. Logs are being sent to stdout."]

    return _envelope(data={"lines": log_lines, "total_lines": len(log_lines)})
