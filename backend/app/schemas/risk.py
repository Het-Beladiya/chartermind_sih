import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.voyage import RiskBucket, SimulatorOverrides


class RiskScoreResult(BaseModel):
    market_risk: float = Field(..., ge=0.0, le=100.0, description="Freight market volatility score (0-100)")
    port_risk: float = Field(..., ge=0.0, le=100.0, description="Berth congestion and demurrage probability score")
    weather_risk: float = Field(..., ge=0.0, le=100.0, description="Monsoon and cyclone swell risk score")
    vessel_risk: float = Field(..., ge=0.0, le=100.0, description="Fleet tight supply or vintage risk score")
    commodity_risk: float = Field(..., ge=0.0, le=100.0, description="Cargo liquefaction or moisture degradation risk")
    overall_score: float = Field(..., ge=0.0, le=100.0, description="Comprehensive weighted composite risk score (0-100)")
    bucket: RiskBucket = Field(..., description="Overall risk classification: Low, Medium, High, Critical")
    primary_driver: str = Field(..., description="Dominant risk contributor")
    summary_sentence: str = Field(..., description="Actionable executive risk takeaway")

    model_config = ConfigDict(from_attributes=True)


class RiskScoreRequest(BaseModel):
    cargo_request_id: uuid.UUID = Field(..., description="Cargo request ID to assess risk exposure for")
    simulator_overrides: Optional[SimulatorOverrides] = Field(default_factory=SimulatorOverrides)
