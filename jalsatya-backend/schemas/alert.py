from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class AlertResponse(BaseModel):
    id: UUID
    village_id: UUID
    alert_type: str
    severity: str
    message: str
    related_prediction_id: Optional[UUID]
    related_forensics_id: Optional[UUID]
    related_sensor_id: Optional[UUID]
    is_acknowledged: bool
    acknowledged_by: Optional[UUID]
    acknowledged_at: Optional[datetime]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    items: List[AlertResponse]
    total: int
    page: int
    per_page: int
    pages: int
