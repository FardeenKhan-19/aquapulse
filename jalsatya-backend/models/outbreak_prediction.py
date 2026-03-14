import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric, Integer, ForeignKey, Enum as SAEnum
from sqlalchemy import Uuid as UUID, JSON as JSONB
from database import Base
import enum


class RiskLevel(str, enum.Enum):
    baseline = "baseline"
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class OutbreakPrediction(Base):
    __tablename__ = "outbreak_predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    village_id = Column(UUID(as_uuid=True), ForeignKey("villages.id"), nullable=False, index=True)
    sensor_reading_id = Column(UUID(as_uuid=True), ForeignKey("sensor_readings.id"), nullable=True)
    predicted_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    risk_score = Column(Numeric, nullable=False)
    risk_level = Column(SAEnum(RiskLevel), nullable=False)
    predicted_disease = Column(String, nullable=True)
    disease_confidence = Column(Numeric, nullable=True)
    affected_population_estimate = Column(Integer, nullable=True)
    onset_hours_estimate = Column(Numeric, nullable=True)
    model_version = Column(String, nullable=True)
    shap_values = Column(JSONB, default={})
    ensemble_scores = Column(JSONB, default={})
