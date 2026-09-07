import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Literal
from pydantic import BaseModel, ConfigDict, Field

PortName = Literal["Paradip", "Dhamra", "Vizag", "Haldia", "Kolkata"]
PortCongestion = Literal["Low", "Medium", "High", "Critical"]
WeatherRiskLevel = Literal["Low", "Medium", "High"]


class PortSpec(BaseModel):
    id: str = Field(..., description="Unique port code or slug (paradip, dhamra, vizag, haldia, kolkata)")
    name: str = Field(..., description="Full official port name")
    state: str = Field(..., description="Indian coastal state (Odisha, Andhra Pradesh, West Bengal)")
    coordinates: List[float] = Field(..., min_length=2, max_length=2, description="[Latitude, Longitude]")
    max_draft: float = Field(..., description="Permissible maximum draft in meters")
    max_loa: float = Field(..., description="Maximum Length Overall (LOA) in meters")
    max_beam: float = Field(..., description="Maximum allowable beam in meters")
    congestion: PortCongestion = Field(..., description="Real-time congestion severity")
    berthing_wait_days: float = Field(..., description="Current average anchorage waiting queue in days")
    handling_rate_mt_per_day: float = Field(..., description="Mechanized conveyor handling productivity (MT/day)")
    handling_rating: float = Field(..., ge=0.0, le=5.0, description="Port efficiency and discharge speed rating (0-5)")
    weather_risk: WeatherRiskLevel = Field(..., description="Marine monsoon/cyclone weather risk level")
    base_port_fee_usd: float = Field(..., description="Standard statutory port dues & pilotage (USD)")
    cargo_handling_cost_per_mt: float = Field(..., description="Stevedoring & terminal handling tariff (USD/MT)")
    description: str = Field(..., description="Terminal description, channel depth restrictions, and coal berths")

    model_config = ConfigDict(from_attributes=True)


class PortSnapshotResponse(BaseModel):
    id: uuid.UUID
    port_id: str
    congestion_level: PortCongestion
    berthing_wait_days: Decimal
    handling_rate_mt_per_day: Decimal
    weather_risk: WeatherRiskLevel
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PortCompatibilityRequest(BaseModel):
    vessel_class_id: str = Field(..., description="Vessel class ID (e.g. capesize, panamax, supramax)")
    port_id: str = Field(..., description="Target East Coast Indian port ID (e.g. paradip, dhamra)")
