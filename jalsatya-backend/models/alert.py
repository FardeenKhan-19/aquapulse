import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy import Uuid as UUID
from database import Base
import enum


class AlertType(str, enum.Enum):
    outbreak_risk = "outbreak_risk"
    sensor_offline = "sensor_offline"
    contamination_detected = "contamination_detected"
    legal_filed = "legal_filed"
    water_quality_normal = "water_quality_normal"
    sensor_anomaly = "sensor_anomaly"


class AlertSeverity(str, enum.Enum):
    info = "info"
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    village_id = Column(UUID(as_uuid=True), ForeignKey("villages.id"), nullable=False, index=True)
    alert_type = Column(SAEnum(AlertType), nullable=False)
    severity = Column(SAEnum(AlertSeverity), nullable=False)
    message = Column(Text, nullable=False)
    related_prediction_id = Column(UUID(as_uuid=True), ForeignKey("outbreak_predictions.id"), nullable=True)
    related_forensics_id = Column(UUID(as_uuid=True), ForeignKey("forensics_reports.id"), nullable=True)
    related_sensor_id = Column(UUID(as_uuid=True), ForeignKey("sensor_nodes.id"), nullable=True)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
