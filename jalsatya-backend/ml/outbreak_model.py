import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from datetime import datetime
from loguru import logger

MODEL_DIR = os.path.join(os.path.dirname(__file__), "trained_models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_NAMES = [
    "tds_ppm", "tds_change_30min", "tds_change_6hr",
    "temperature_c", "temp_change_1hr",
    "turbidity_ntu", "ph", "humidity_pct", "flow_rate_lpm",
    "hour_of_day", "day_of_week", "season",
    "rainfall_proxy", "historical_outbreak_count",
]

RISK_LEVELS = ["baseline", "low", "medium", "high", "critical"]
DISEASE_TYPES = ["none", "gastroenteritis", "typhoid", "cholera", "hepatitis_a"]


class OutbreakPredictor:
    def __init__(self):
        self.xgb_model: Optional[XGBClassifier] = None
        self.rf_model: Optional[RandomForestClassifier] = None
        self.gbm_model: Optional[GradientBoostingClassifier] = None
        self.disease_model: Optional[RandomForestClassifier] = None
        self.risk_encoder = LabelEncoder()
        self.disease_encoder = LabelEncoder()
        self.model_version = "1.0"
        self._loaded = False

    def load_model(self):
        if self._loaded:
            return

        xgb_path = os.path.join(MODEL_DIR, "outbreak_xgb.pkl")
        rf_path = os.path.join(MODEL_DIR, "outbreak_rf.pkl")
        gbm_path = os.path.join(MODEL_DIR, "outbreak_gbm.pkl")
        disease_path = os.path.join(MODEL_DIR, "disease_classifier.pkl")
        meta_path = os.path.join(MODEL_DIR, "outbreak_meta.pkl")

        if all(os.path.exists(p) for p in [xgb_path, rf_path, gbm_path, disease_path, meta_path]):
            self.xgb_model = joblib.load(xgb_path)
            self.rf_model = joblib.load(rf_path)
            self.gbm_model = joblib.load(gbm_path)
            self.disease_model = joblib.load(disease_path)
            meta = joblib.load(meta_path)
            self.risk_encoder = meta["risk_encoder"]
            self.disease_encoder = meta["disease_encoder"]
            self.model_version = meta.get("version", "1.0")
            self._loaded = True
            logger.info(f"Outbreak models loaded (version: {self.model_version})")
        else:
            logger.info("No trained outbreak models found, training now...")
            self.train()

    def train(self, X: np.ndarray = None, y_risk: np.ndarray = None, y_disease: np.ndarray = None):
        if X is None:
            from ml.data_generator import generate_outbreak_training_data
            X, y_risk, y_disease = generate_outbreak_training_data(n_samples=50000)

        self.risk_encoder.fit(RISK_LEVELS)
        self.disease_encoder.fit(DISEASE_TYPES)

        y_risk_encoded = self.risk_encoder.transform(y_risk)
        y_disease_encoded = self.disease_encoder.transform(y_disease)

        self.xgb_model = XGBClassifier(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="mlogloss",
            random_state=42,
            n_jobs=-1,
        )
        self.xgb_model.fit(X, y_risk_encoded)
        logger.info(f"XGBoost trained. Accuracy: {self.xgb_model.score(X, y_risk_encoded):.4f}")

        self.rf_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
        self.rf_model.fit(X, y_risk_encoded)
        logger.info(f"RandomForest trained. Accuracy: {self.rf_model.score(X, y_risk_encoded):.4f}")

        self.gbm_model = GradientBoostingClassifier(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            random_state=42,
        )
        self.gbm_model.fit(X, y_risk_encoded)
        logger.info(f"GBM trained. Accuracy: {self.gbm_model.score(X, y_risk_encoded):.4f}")

        self.disease_model = RandomForestClassifier(
            n_estimators=150,
            max_depth=10,
            random_state=42,
            n_jobs=-1,
        )
        self.disease_model.fit(X, y_disease_encoded)
        logger.info(f"Disease classifier trained. Accuracy: {self.disease_model.score(X, y_disease_encoded):.4f}")

        self.model_version = f"v{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        self._save_models()
        self._loaded = True

    def _save_models(self):
        joblib.dump(self.xgb_model, os.path.join(MODEL_DIR, "outbreak_xgb.pkl"))
        joblib.dump(self.rf_model, os.path.join(MODEL_DIR, "outbreak_rf.pkl"))
        joblib.dump(self.gbm_model, os.path.join(MODEL_DIR, "outbreak_gbm.pkl"))
        joblib.dump(self.disease_model, os.path.join(MODEL_DIR, "disease_classifier.pkl"))
        joblib.dump(
            {
                "risk_encoder": self.risk_encoder,
                "disease_encoder": self.disease_encoder,
                "version": self.model_version,
                "trained_at": datetime.utcnow().isoformat(),
                "feature_names": FEATURE_NAMES,
            },
            os.path.join(MODEL_DIR, "outbreak_meta.pkl"),
        )
        logger.info(f"Models saved to {MODEL_DIR}")

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        if not self._loaded:
            self.load_model()

        X = np.array([[features.get(f, 0.0) for f in FEATURE_NAMES]])

        xgb_proba = self.xgb_model.predict_proba(X)[0]
        rf_proba = self.rf_model.predict_proba(X)[0]
        gbm_proba = self.gbm_model.predict_proba(X)[0]

        ensemble_proba = (xgb_proba * 0.4 + rf_proba * 0.3 + gbm_proba * 0.3)
        risk_class = int(np.argmax(ensemble_proba))
        risk_label = self.risk_encoder.inverse_transform([risk_class])[0]

        risk_score = float(ensemble_proba[risk_class]) * 100
        if risk_class == 0:
            risk_score = min(risk_score, 25)
        elif risk_class == 1:
            risk_score = 25 + (risk_score - 25) * 0.6
        elif risk_class == 2:
            risk_score = max(50, min(risk_score, 74))
        elif risk_class == 3:
            risk_score = max(75, min(risk_score, 87))
        elif risk_class == 4:
            risk_score = max(88, risk_score)

        disease_proba = self.disease_model.predict_proba(X)[0]
        disease_class = int(np.argmax(disease_proba))
        disease_label = self.disease_encoder.inverse_transform([disease_class])[0]
        disease_confidence = float(disease_proba[disease_class])

        if disease_label == "none" and risk_class >= 2:
            sorted_indices = np.argsort(disease_proba)[::-1]
            if len(sorted_indices) > 1:
                disease_class = sorted_indices[1]
                disease_label = self.disease_encoder.inverse_transform([disease_class])[0]
                disease_confidence = float(disease_proba[disease_class])

        onset_hours = max(6, 96 - risk_score * 0.9)

        try:
            import shap
            explainer = shap.TreeExplainer(self.xgb_model)
            shap_vals = explainer.shap_values(X)
            if isinstance(shap_vals, list):
                shap_dict = {FEATURE_NAMES[i]: float(shap_vals[risk_class][0][i]) for i in range(len(FEATURE_NAMES))}
            else:
                shap_dict = {FEATURE_NAMES[i]: float(shap_vals[0][i]) for i in range(len(FEATURE_NAMES))}
        except Exception as e:
            logger.debug(f"SHAP computation failed: {e}")
            importances = self.xgb_model.feature_importances_
            shap_dict = {FEATURE_NAMES[i]: float(importances[i]) for i in range(len(FEATURE_NAMES))}

        ensemble_scores = {
            "xgboost": {RISK_LEVELS[i]: float(xgb_proba[i]) for i in range(len(xgb_proba))},
            "random_forest": {RISK_LEVELS[i]: float(rf_proba[i]) for i in range(len(rf_proba))},
            "gradient_boosting": {RISK_LEVELS[i]: float(gbm_proba[i]) for i in range(len(gbm_proba))},
            "ensemble": {RISK_LEVELS[i]: float(ensemble_proba[i]) for i in range(len(ensemble_proba))},
        }

        return {
            "risk_score": round(risk_score, 2),
            "risk_level": risk_label,
            "disease": disease_label if disease_label != "none" else None,
            "disease_confidence": round(disease_confidence, 4),
            "onset_hours": round(onset_hours, 1),
            "model_version": self.model_version,
            "shap_values": shap_dict,
            "ensemble_scores": ensemble_scores,
        }

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "version": self.model_version,
            "loaded": self._loaded,
            "feature_names": FEATURE_NAMES,
            "risk_levels": RISK_LEVELS,
            "disease_types": DISEASE_TYPES,
            "models": ["XGBoost", "RandomForest", "GradientBoosting"],
            "model_dir": MODEL_DIR,
        }
