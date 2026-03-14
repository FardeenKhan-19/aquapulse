import pytest
from ml.forensics_model import ForensicsClassifier, FORENSICS_FEATURE_NAMES, SOURCE_CLASSES
from ml.data_generator import generate_forensics_training_data


def test_forensics_training_data():
    X, y, X_dist, y_dist = generate_forensics_training_data(n_samples=1000)
    assert X.shape == (1000, 12)
    assert len(y) == 1000
    assert len(y_dist) == 1000


def test_forensics_classifier_predict():
    classifier = ForensicsClassifier()
    classifier.load_model()

    features = {
        "tds_rise_rate_ppm_per_min": 45,
        "tds_absolute_delta": 500,
        "tds_peak_to_baseline_ratio": 3.5,
        "time_of_spike_hour": 2,
        "duration_of_elevation_minutes": 45,
        "temperature_delta_at_spike": 1.5,
        "turbidity_correlated_with_tds": 0,
        "ph_drop_at_spike": 1.2,
        "flow_anomaly_at_spike": 0,
        "humidity_at_spike": 55,
        "rain_in_previous_4hr": 0,
        "spike_pattern_type": 0,
    }

    result = classifier.predict(features)
    assert "source" in result
    assert "confidence" in result
    assert result["source"] in SOURCE_CLASSES
    assert 0 <= result["confidence"] <= 1


def test_forensics_classifier_sewage():
    classifier = ForensicsClassifier()
    classifier.load_model()

    features = {
        "tds_rise_rate_ppm_per_min": 15,
        "tds_absolute_delta": 250,
        "tds_peak_to_baseline_ratio": 2.5,
        "time_of_spike_hour": 12,
        "duration_of_elevation_minutes": 90,
        "temperature_delta_at_spike": 1.0,
        "turbidity_correlated_with_tds": 1,
        "ph_drop_at_spike": 0.5,
        "flow_anomaly_at_spike": 1,
        "humidity_at_spike": 85,
        "rain_in_previous_4hr": 1,
        "spike_pattern_type": 1,
    }

    result = classifier.predict(features)
    assert result["source"] in SOURCE_CLASSES
