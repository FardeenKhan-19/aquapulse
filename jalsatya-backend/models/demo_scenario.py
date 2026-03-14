import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy import Uuid as UUID, JSON as JSONB
from database import Base


class DemoScenario(Base):
    __tablename__ = "demo_scenarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_number = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    village_id = Column(UUID(as_uuid=True), ForeignKey("villages.id"), nullable=True)
    is_active = Column(Boolean, default=False)
    triggered_at = Column(DateTime, nullable=True)
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    scenario_data = Column(JSONB, default={})
