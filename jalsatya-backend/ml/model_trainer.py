from ml.outbreak_model import OutbreakPredictor
from ml.forensics_model import ForensicsClassifier
from loguru import logger
import os

MODEL_DIR = os.path.join(os.path.dirname(__file__), "trained_models")


def ensure_models_trained():
    os.makedirs(MODEL_DIR, exist_ok=True)

    outbreak_files = ["outbreak_xgb.pkl", "outbreak_rf.pkl", "outbreak_gbm.pkl", "disease_classifier.pkl", "outbreak_meta.pkl"]
    forensics_files = ["forensics_rf.pkl", "forensics_distance.pkl", "forensics_meta.pkl"]

    outbreak_exists = all(os.path.exists(os.path.join(MODEL_DIR, f)) for f in outbreak_files)
    forensics_exists = all(os.path.exists(os.path.join(MODEL_DIR, f)) for f in forensics_files)

    if not outbreak_exists:
        logger.info("Training outbreak prediction models...")
        predictor = OutbreakPredictor()
        predictor.train()
        logger.info("Outbreak models trained and saved.")
    else:
        logger.info("Outbreak models already exist, skipping training.")

    if not forensics_exists:
        logger.info("Training forensics classification models...")
        classifier = ForensicsClassifier()
        classifier.train()
        logger.info("Forensics models trained and saved.")
    else:
        logger.info("Forensics models already exist, skipping training.")


def retrain_all_models():
    logger.info("Retraining all models...")

    predictor = OutbreakPredictor()
    predictor.train()

    classifier = ForensicsClassifier()
    classifier.train()

    logger.info("All models retrained.")
    return {
        "outbreak_version": predictor.model_version,
        "forensics_version": classifier.model_version,
    }


if __name__ == "__main__":
    ensure_models_trained()
