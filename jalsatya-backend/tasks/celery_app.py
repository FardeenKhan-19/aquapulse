from celery import Celery
from celery.schedules import crontab
from config import settings

celery_app = Celery(
    "aquapulse",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "tasks.sensor_tasks",
        "tasks.prediction_tasks",
        "tasks.alert_tasks",
        "tasks.legal_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    broker_connection_retry_on_startup=True,
)

celery_app.conf.beat_schedule = {
    "generate-mock-readings": {
        "task": "tasks.sensor_tasks.generate_mock_readings",
        "schedule": settings.MOCK_UPDATE_INTERVAL_SECONDS,
        "options": {"queue": "sensor"},
    },
    "check-sensor-offline": {
        "task": "tasks.sensor_tasks.check_sensor_offline",
        "schedule": 300.0,
        "options": {"queue": "sensor"},
    },
    "retrain-models-weekly": {
        "task": "tasks.prediction_tasks.retrain_models",
        "schedule": crontab(hour=2, minute=0, day_of_week=0),
        "options": {"queue": "ml"},
    },
    "send-daily-digest": {
        "task": "tasks.alert_tasks.send_daily_digest",
        "schedule": crontab(hour=2, minute=30),
        "options": {"queue": "notification"},
    },
    "check-filing-status": {
        "task": "tasks.legal_tasks.check_filing_status",
        "schedule": crontab(hour="*/6", minute=0),
        "options": {"queue": "legal"},
    },
}
