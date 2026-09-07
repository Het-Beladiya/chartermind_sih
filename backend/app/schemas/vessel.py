import uuid
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.voyage import SimulatorOverrides, VesselAvailability


class VesselSpec(BaseModel):
    id: str = Field(..., description="Vessel identifier or class code (e.g. capesize, panamax)")
    name: str = Field(..., description="Commercial vessel class name")
    category_name: str = Field(..., description="Category label")
    dwt_min: float = Field(..., description="Minimum Deadweight Tonnage (DWT)")
    dwt_max: float = Field(..., description="Maximum Deadweight Tonnage (DWT)")
    dwt_avg: float = Field(..., description="Average capacity in DWT")
    draft: float = Field(..., description="Laden draft in meters")
    loa: float = Field(..., description="Length Overall in meters")
    beam: float = Field(..., description="Beam width in meters")
    speed: float = Field(..., description="Design sailing speed in knots")
    fuel_consumption: float = Field(..., description="VLSFO bunker consumption in MT/day")
    base_freight_rate: float = Field(..., description="Baseline daily time charter or freight quote")
    hourly_rate: float = Field(..., description="Operating cost per hour (USD)")
    demurrage_rate_per_day: float = Field(..., description="Contractual demurrage rate (USD/day)")
    availability: VesselAvailability = Field("Available", description="Market charter availability status")
    description: str = Field(..., description="Vessel operational characteristics")

    model_config = ConfigDict(from_attributes=True)


class PortCompatibilityResult(BaseModel):
    is_compatible: bool = Field(..., description="Whether vessel can berth safely at destination port")
    score: float = Field(..., ge=0.0, le=100.0, description="Berthing compatibility score (0-100)")
    draft_fit: bool = Field(..., description="Whether laden draft fits port permissible water depth")
    loa_fit: bool = Field(..., description="Whether vessel length fits quay berth length")
    beam_fit: bool = Field(..., description="Whether vessel beam fits channel and crane outreach")
    warnings: List[str] = Field(default_factory=list, description="Navigation, tidal, or lighterage caveats")

    model_config = ConfigDict(from_attributes=True)


class VesselScoreBreakdown(BaseModel):
    vessel: VesselSpec
    final_score: float = Field(..., ge=0.0, le=100.0, description="Overall weighted multi-criteria recommendation score")
    capacity_fit_score: float = Field(..., ge=0.0, le=100.0)
    port_compatibility_score: float = Field(..., ge=0.0, le=100.0)
    cost_competitiveness_score: float = Field(..., ge=0.0, le=100.0)
    availability_score: float = Field(..., ge=0.0, le=100.0)
    idle_time_score: float = Field(..., ge=0.0, le=100.0)
    is_best_choice: bool = Field(False, description="Whether this vessel is the top-ranked choice")
    compatibility: PortCompatibilityResult
    reasons: List[str] = Field(default_factory=list, description="Pros and considerations for charterers")
    estimated_freight_per_mt: float = Field(..., description="Estimated freight rate (USD/MT)")
    estimated_total_freight: float = Field(..., description="Estimated total freight lump-sum (USD)")

    model_config = ConfigDict(from_attributes=True)


class VesselRecommendRequest(BaseModel):
    cargo_request_id: uuid.UUID = Field(..., description="Cargo request to evaluate vessel suitability for")
    simulator_overrides: Optional[SimulatorOverrides] = Field(default_factory=SimulatorOverrides)


class VesselRecommendResponse(BaseModel):
    cargo_request_id: uuid.UUID
    recommended_vessel_class: str
    recommendations: List[VesselScoreBreakdown]

    model_config = ConfigDict(from_attributes=True)
