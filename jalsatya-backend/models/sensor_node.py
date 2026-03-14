import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Boolean, DateTime, Date, Numeric, ForeignKey, JSON
from sqlalchemy import Uuid as UUID, JSON as JSONB
from database import Base


class SensorNode(Base):
    __tablename__ = "sensor_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hardware_id = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    village_id = Column(UUID(as_uuid=True), ForeignKey("villages.id"), nullable=False)
    gps_lat = Column(Numeric(10, 8), nullable=True)
    gps_lng = Column(Numeric(11, 8), nullable=True)
    api_key = Column(String, unique=True, nullable=False, index=True)
    api_key_hash = Column(String, nullable=False)
    sensor_types = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    last_seen = Column(DateTime, nullable=True)
    calibration_data = Column(JSONB, default={})
    deployment_date = Column(Date, nullable=True)
    registered_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
