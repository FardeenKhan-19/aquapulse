import pytest
import numpy as np
from ml.outbreak_model import OutbreakPredictor, FEATURE_NAMES
from ml.data_generator import generate_outbreak_training_data


def test_outbreak_predictor_training():
    X, y_risk, y_disease = generate_outbreak_training_data(n_samples=1000)
    assert X.shape == (1000, 14)
    assert len(y_risk) == 1000
    assert len(y_disease) == 1000


def test_outbreak_predictor_predict():
    predictor = OutbreakPredictor()
    predictor.load_model()

    features = {
        "tds_ppm": 850,
        "tds_change_30min": 200,
        "tds_change_6hr": 400,
        "temperature_c": 32,
        "temp_change_1hr": 2,
        "turbidity_ntu": 25,
        "ph": 5.5,
        "humidity_pct": 80,
        "flow_rate_lpm": 2.5,
        "hour_of_day": 14,
        "day_of_week": 3,
        "season": 1,
        "rainfall_proxy": 10,
        "historical_outbreak_count": 3,
    }

    result = predictor.predict(features)
    assert "risk_score" in result
    assert "risk_level" in result
    assert "shap_values" in result
    assert "ensemble_scores" in result
    assert 0 <= result["risk_score"] <= 100
    assert result["risk_level"] in ["baseline", "low", "medium", "high", "critical"]


def test_outbreak_predictor_baseline():
    predictor = OutbreakPredictor()
    predictor.load_model()

    features = {
        "tds_ppm": 200,
        "tds_change_30min": 0,
        "tds_change_6hr": 0,
        "temperature_c": 25,
        "temp_change_1hr": 0,
        "turbidity_ntu": 3,
        "ph": 7.2,
        "humidity_pct": 55,
        "flow_rate_lpm": 5,
        "hour_of_day": 10,
        "day_of_week": 1,
        "season": 3,
        "rainfall_proxy": 0,
        "historical_outbreak_count": 0,
    }

    result = predictor.predict(features)
    assert result["risk_score"] < 50
