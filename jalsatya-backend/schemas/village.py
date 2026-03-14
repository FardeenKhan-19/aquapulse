from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class VillageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    district: str = Field(..., min_length=1, max_length=200)
    state: str = Field(..., min_length=1, max_length=200)
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    population: Optional[int] = None
    primary_water_source: Optional[str] = None
    risk_threshold_low: Optional[float] = 30
    risk_threshold_medium: Optional[float] = 55
    risk_threshold_high: Optional[float] = 75
    risk_threshold_critical: Optional[float] = 88



class VillageUpdate(BaseModel):
    name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    population: Optional[int] = None
    primary_water_source: Optional[str] = None
    risk_threshold_low: Optional[float] = None
    risk_threshold_medium: Optional[float] = None
    risk_threshold_high: Optional[float] = None
    risk_threshold_critical: Optional[float] = None


class VillageResponse(BaseModel):
    id: UUID
    name: str
    district: str
    state: str
    gps_lat: Optional[float]
    gps_lng: Optional[float]
    population: Optional[int]
    primary_water_source: Optional[str]
    assigned_health_officer_ids: Optional[List[UUID]]
    risk_threshold_low: Optional[float]
    risk_threshold_medium: Optional[float]
    risk_threshold_high: Optional[float]
    risk_threshold_critical: Optional[float]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class VillageListResponse(BaseModel):
    items: List[VillageResponse]
    total: int
    page: int
    per_page: int
    pages: int
