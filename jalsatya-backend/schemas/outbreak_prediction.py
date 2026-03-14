from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


class OutbreakPredictionResponse(BaseModel):
    id: UUID
    village_id: UUID
    sensor_reading_id: Optional[UUID]
    predicted_at: datetime
    risk_score: float
    risk_level: str
    predicted_disease: Optional[str]
    disease_confidence: Optional[float]
    affected_population_estimate: Optional[int]
    onset_hours_estimate: Optional[float]
    model_version: Optional[str]
    shap_values: Optional[Dict[str, Any]]
    ensemble_scores: Optional[Dict[str, Any]]

    model_config = {"from_attributes": True}


class OutbreakPredictionListResponse(BaseModel):
    items: List[OutbreakPredictionResponse]
    total: int
    page: int
    per_page: int
    pages: int


class SimulateRequest(BaseModel):
    village_id: UUID
    tds_ppm: Optional[float] = 300
    temperature_c: Optional[float] = 28
    turbidity_ntu: Optional[float] = 5
    ph: Optional[float] = 7.0
    humidity_pct: Optional[float] = 65
    flow_rate_lpm: Optional[float] = 4.0
