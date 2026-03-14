from tasks.celery_app import celery_app
from ml.model_trainer import retrain_all_models
from loguru import logger


@celery_app.task(name="tasks.prediction_tasks.run_prediction_pipeline")
def run_prediction_pipeline(reading_id: str, village_id: str):
    logger.info(f"Prediction pipeline triggered for reading {reading_id} in village {village_id}")
    return f"Prediction pipeline completed for {reading_id}"


@celery_app.task(name="tasks.prediction_tasks.retrain_models")
def retrain_models():
    logger.info("Starting scheduled model retraining...")
    try:
        result = retrain_all_models()
        logger.info(f"Model retraining complete: {result}")
        return result
    except Exception as e:
        logger.error(f"Model retraining failed: {e}")
        raise
