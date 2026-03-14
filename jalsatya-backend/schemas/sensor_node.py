from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, date


class SensorNodeCreate(BaseModel):
    hardware_id: str = Field(..., min_length=1, max_length=200)
    name: str = Field(..., min_length=1, max_length=200)
    village_id: UUID
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    sensor_types: List[str] = Field(default=["tds", "temperature", "turbidity", "ph", "humidity", "flow"])
    deployment_date: Optional[date] = None



class SensorNodeUpdate(BaseModel):
    name: Optional[str] = None
    village_id: Optional[UUID] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    sensor_types: Optional[List[str]] = None
    is_active: Optional[bool] = None
    calibration_data: Optional[Dict[str, Any]] = None


class SensorNodeResponse(BaseModel):
    id: UUID
    hardware_id: str
    name: str
    village_id: UUID
    gps_lat: Optional[float]
    gps_lng: Optional[float]
    sensor_types: Optional[List[str]]
    is_active: bool
    is_approved: bool
    last_seen: Optional[datetime]
    calibration_data: Optional[Dict[str, Any]]
    deployment_date: Optional[date]
    registered_by: Optional[UUID]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class SensorNodeCreateResponse(BaseModel):
    sensor_id: UUID
    api_key: str
    qr_code_base64: str
    qr_code_url: Optional[str] = None
    message: str = "API key shown once. Store securely."


class SensorNodeListResponse(BaseModel):
    items: List[SensorNodeResponse]
    total: int
    page: int
    per_page: int
    pages: int


class CalibrateRequest(BaseModel):
    calibration_data: Dict[str, Any]
