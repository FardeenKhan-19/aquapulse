from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


class ForensicsReportResponse(BaseModel):
    id: UUID
    village_id: UUID
    outbreak_prediction_id: Optional[UUID]
    generated_at: datetime
    contamination_source: str
    source_confidence: Optional[float]
    contamination_start_timestamp: Optional[datetime]
    upstream_distance_km: Optional[float]
    tds_baseline: Optional[float]
    tds_peak: Optional[float]
    tds_rise_rate: Optional[float]
    pattern_signature: Optional[Dict[str, Any]]
    supporting_evidence: Optional[Dict[str, Any]]

    model_config = {"from_attributes": True}


class ForensicsReportListResponse(BaseModel):
    items: List[ForensicsReportResponse]
    total: int
    page: int
    per_page: int
    pages: int
