from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


class SensorReadingCreate(BaseModel):
    timestamp: datetime
    tds_ppm: Optional[float] = Field(None, ge=0, le=5000)
    temperature_c: Optional[float] = Field(None, ge=-10, le=60)
    turbidity_ntu: Optional[float] = Field(None, ge=0, le=4000)
    ph: Optional[float] = Field(None, ge=0, le=14)
    humidity_pct: Optional[float] = Field(None, ge=0, le=100)
    flow_rate_lpm: Optional[float] = Field(None, ge=0, le=500)
    battery_pct: Optional[float] = None
    signal_strength_dbm: Optional[float] = None
    firmware_version: Optional[str] = None


class SensorReadingResponse(BaseModel):
    id: UUID
    sensor_node_id: UUID
    village_id: UUID
    timestamp: datetime
    tds_ppm: Optional[float]
    temperature_c: Optional[float]
    turbidity_ntu: Optional[float]
    ph: Optional[float]
    humidity_pct: Optional[float]
    flow_rate_lpm: Optional[float]
    raw_payload: Optional[Dict[str, Any]]
    is_anomaly: bool
    anomaly_score: Optional[float]

    model_config = {"from_attributes": True}


class SensorReadingListResponse(BaseModel):
    items: List[SensorReadingResponse]
    total: int
    page: int
    per_page: int
    pages: int


class SensorReadingAccepted(BaseModel):
    status: str = "accepted"
    reading_id: UUID
