import numpy as np
from typing import Dict, Any, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
import joblib
import os
from datetime import datetime
from loguru import logger

MODEL_DIR = os.path.join(os.path.dirname(__file__), "trained_models")
os.makedirs(MODEL_DIR, exist_ok=True)

FORENSICS_FEATURE_NAMES = [
    "tds_rise_rate_ppm_per_min",
    "tds_absolute_delta",
    "tds_peak_to_baseline_ratio",
    "time_of_spike_hour",
    "duration_of_elevation_minutes",
    "temperature_delta_at_spike",
    "turbidity_correlated_with_tds",
    "ph_drop_at_spike",
    "flow_anomaly_at_spike",
    "humidity_at_spike",
    "rain_in_previous_4hr",
    "spike_pattern_type",
]

SOURCE_CLASSES = [
    "industrial_effluent",
    "sewage_overflow",
    "fertilizer_runoff",
    "pipe_corrosion",
    "algal_bloom",
    "natural_hardness",
    "unknown",
]


class ForensicsClassifier:
    def __init__(self):
        self.model: Optional[RandomForestClassifier] = None
        self.distance_model: Optional[LinearRegression] = None
        self.model_version = "1.0"
        self._loaded = False

    def load_model(self):
        if self._loaded:
            return

        model_path = os.path.join(MODEL_DIR, "forensics_rf.pkl")
        dist_path = os.path.join(MODEL_DIR, "forensics_distance.pkl")
        meta_path = os.path.join(MODEL_DIR, "forensics_meta.pkl")

        if all(os.path.exists(p) for p in [model_path, dist_path, meta_path]):
            self.model = joblib.load(model_path)
            self.distance_model = joblib.load(dist_path)
            meta = joblib.load(meta_path)
            self.model_version = meta.get("version", "1.0")
            self._loaded = True
            logger.info(f"Forensics model loaded (version: {self.model_version})")
        else:
            logger.info("No trained forensics model found, training now...")
            self.train()

    def train(self, X: np.ndarray = None, y: np.ndarray = None):
        if X is None:
            from ml.data_generator import generate_forensics_training_data
            X, y, X_dist, y_dist = generate_forensics_training_data(n_samples=30000)
        else:
            X_dist = X[:, 0:1]
            y_dist = np.random.uniform(0.5, 15, len(X))

        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(X, y)
        logger.info(f"Forensics classifier trained. Accuracy: {self.model.score(X, y):.4f}")

        self.distance_model = LinearRegression()
        self.distance_model.fit(X_dist, y_dist)
        logger.info("Distance regression model trained.")

        self.model_version = f"v{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        self._save_models()
        self._loaded = True

    def _save_models(self):
        joblib.dump(self.model, os.path.join(MODEL_DIR, "forensics_rf.pkl"))
        joblib.dump(self.distance_model, os.path.join(MODEL_DIR, "forensics_distance.pkl"))
        joblib.dump(
            {
                "version": self.model_version,
                "trained_at": datetime.utcnow().isoformat(),
                "feature_names": FORENSICS_FEATURE_NAMES,
                "source_classes": SOURCE_CLASSES,
            },
            os.path.join(MODEL_DIR, "forensics_meta.pkl"),
        )

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        if not self._loaded:
            self.load_model()

        X = np.array([[features.get(f, 0.0) for f in FORENSICS_FEATURE_NAMES]])
        proba = self.model.predict_proba(X)[0]
        pred_class = int(np.argmax(proba))
        confidence = float(proba[pred_class])

        source_label = SOURCE_CLASSES[pred_class] if pred_class < len(SOURCE_CLASSES) else "unknown"

        if confidence < 0.6:
            source_label = "unknown"

        rise_rate = features.get("tds_rise_rate_ppm_per_min", 0)
        if rise_rate > 0:
            estimated_distance = float(self.distance_model.predict([[rise_rate]])[0])
            estimated_distance = max(0.1, min(estimated_distance, 50))
        else:
            estimated_distance = 0.0

        class_probabilities = {SOURCE_CLASSES[i]: float(proba[i]) for i in range(len(proba)) if i < len(SOURCE_CLASSES)}

        return {
            "source": source_label,
            "confidence": round(confidence, 4),
            "class_probabilities": class_probabilities,
            "estimated_distance_km": round(estimated_distance, 2),
            "model_version": self.model_version,
        }

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "version": self.model_version,
            "loaded": self._loaded,
            "feature_names": FORENSICS_FEATURE_NAMES,
            "source_classes": SOURCE_CLASSES,
            "model_dir": MODEL_DIR,
        }
