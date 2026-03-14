import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, Integer, JSON
from sqlalchemy import Uuid as UUID
from database import Base


class Village(Base):
    __tablename__ = "villages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    gps_lat = Column(Numeric(10, 8), nullable=True)
    gps_lng = Column(Numeric(11, 8), nullable=True)
    population = Column(Integer, nullable=True)
    primary_water_source = Column(String, nullable=True)
    assigned_health_officer_ids = Column(JSON, default=[])
    risk_threshold_low = Column(Numeric, default=30)
    risk_threshold_medium = Column(Numeric, default=55)
    risk_threshold_high = Column(Numeric, default=75)
    risk_threshold_critical = Column(Numeric, default=88)
    created_at = Column(DateTime, default=datetime.utcnow)
