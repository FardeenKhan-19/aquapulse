import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Enum as SAEnum
from sqlalchemy import Uuid as UUID, JSON as JSONB
from database import Base
import enum


class ContaminationSource(str, enum.Enum):
    industrial_effluent = "industrial_effluent"
    sewage_overflow = "sewage_overflow"
    fertilizer_runoff = "fertilizer_runoff"
    pipe_corrosion = "pipe_corrosion"
    algal_bloom = "algal_bloom"
    natural_hardness = "natural_hardness"
    unknown = "unknown"


class ForensicsReport(Base):
    __tablename__ = "forensics_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    village_id = Column(UUID(as_uuid=True), ForeignKey("villages.id"), nullable=False, index=True)
    outbreak_prediction_id = Column(UUID(as_uuid=True), ForeignKey("outbreak_predictions.id"), nullable=True)
    generated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    contamination_source = Column(SAEnum(ContaminationSource), nullable=False)
    source_confidence = Column(Numeric, nullable=True)
    contamination_start_timestamp = Column(DateTime, nullable=True)
    upstream_distance_km = Column(Numeric, nullable=True)
    tds_baseline = Column(Numeric, nullable=True)
    tds_peak = Column(Numeric, nullable=True)
    tds_rise_rate = Column(Numeric, nullable=True)
    pattern_signature = Column(JSONB, default={})
    supporting_evidence = Column(JSONB, default={})
