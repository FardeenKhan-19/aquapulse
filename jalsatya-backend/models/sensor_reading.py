import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy import Uuid as UUID, JSON as JSONB
from database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sensor_node_id = Column(UUID(as_uuid=True), ForeignKey("sensor_nodes.id"), nullable=False, index=True)
    village_id = Column(UUID(as_uuid=True), ForeignKey("villages.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    tds_ppm = Column(Numeric, nullable=True)
    temperature_c = Column(Numeric, nullable=True)
    turbidity_ntu = Column(Numeric, nullable=True)
    ph = Column(Numeric, nullable=True)
    humidity_pct = Column(Numeric, nullable=True)
    flow_rate_lpm = Column(Numeric, nullable=True)
    raw_payload = Column(JSONB, default={})
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Numeric, nullable=True)
