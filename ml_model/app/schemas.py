"""
Pydantic Data Schemas for the CharterMind ML Application.
Defines strict type validation for API requests and model responses.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    models_loaded: Dict[str, bool]
    version: str = "1.0.0"


class ForecastRequest(BaseModel):
    horizons_months: int = Field(default=12, ge=1, le=24, description="Number of months forward to forecast (1 to 24)")


class ForecastPoint(BaseModel):
    date: str
    month_step: int
    predicted_bdi: float
    confidence_80_lower: float
    confidence_80_upper: float
    confidence_95_lower: float
    confidence_95_upper: float
    capesize_subindex: float
    panamax_subindex: float
    supramax_subindex: float
    handysize_subindex: float
    tce_capesize_usd: float
    tce_panamax_usd: float
    tce_supramax_usd: float
    tce_handysize_usd: float


class ForecastResponse(BaseModel):
    status: str
    model_name: str
    last_historical_bdi: float
    last_historical_date: str
    forecast: List[ForecastPoint]
    walk_forward_metrics: Dict[str, Any]


class PortSpecs(BaseModel):
    port_name: str
    state: str
    channel_depth_m: float
    max_draft_m: float
    max_beam_m: float
    max_loa_m: float
    max_deadweight_dwt: float
    harbor_type: str
    pilotage_compulsory: str
    solid_bulk_facilities: str
    latitude: float
    longitude: float


class VesselRecommendationRequest(BaseModel):
    port_name: str
    cargo_tonnes: float = Field(gt=0)
    distance_nm: float = Field(default=2000.0, gt=0)
    bunker_price_usd: float = Field(default=620.0, gt=0)
    target_horizon_months: int = Field(default=1, ge=1, le=24)


class VesselOption(BaseModel):
    vessel_id: str
    name: str
    vessel_class: str
    deadweight_dwt: float
    draft_m: float
    loa_m: float
    beam_m: float
    speed_knots: float
    fuel_consumption_tonnes_day: float
    port_fuel_consumption_tonnes_day: float
    compatible: bool
    rejection_reasons: List[str]
    sea_days: float
    port_days: float
    total_voyage_days: float
    fuel_cost_usd: float
    charter_cost_usd: float
    port_dues_usd: float
    total_voyage_cost_usd: float
    freight_rate_usd_per_tonne: float
    score: float


class VesselRecommendationResponse(BaseModel):
    status: str
    target_port: str
    port_specs: Dict[str, Any]
    cargo_tonnes: float
    distance_nm: float
    recommended_vessel: Optional[VesselOption]
    all_options: List[VesselOption]


class PortIntelligenceRequest(BaseModel):
    port_name: str


class PortIntelligenceResponse(BaseModel):
    status: str
    port_name: str
    specs: Dict[str, Any]
    historical_traffic_10yr: List[Dict[str, Any]]
    traffic_stats: Dict[str, float]
    congestion_score_z: float
    capacity_utilization_pct: float
    pre_berthing_detention_days: float
    operational_advisories: List[str]


class IdleTimeRequest(BaseModel):
    port_name: str
    vessel_draft_m: float
    vessel_class: str
    month: int = Field(default=7, ge=1, le=12)
    weather_condition: str = Field(default="Normal")


class IdleTimeResponse(BaseModel):
    status: str
    port_name: str
    vessel_class: str
    vessel_draft_m: float
    expected_wait_hours: float
    p10_wait_hours: float
    p50_wait_hours: float
    p90_wait_hours: float
    demurrage_risk_usd: float
    congestion_factors: Dict[str, float]
    methodology: str


class RiskRequest(BaseModel):
    port_name: str
    vessel_class: str
    vessel_draft_m: float
    cargo_tonnes: float
    voyage_month: int = Field(default=7, ge=1, le=12)
    weather_condition: str = Field(default="Normal")
    freight_hedge_status: str = Field(default="Unhedged")


class RiskResponse(BaseModel):
    status: str
    overall_risk_score: float
    risk_level: str
    component_scores: Dict[str, float]
    identified_risks: List[str]
    mitigation_clauses: List[str]


class SimulatorRequest(BaseModel):
    port_name: str
    vessel_class: str
    cargo_tonnes: float
    distance_nm: float
    congestion_shock_pct: float = Field(default=0.0)
    weather_shock: str = Field(default="Normal")
    freight_rate_shock_pct: float = Field(default=0.0)
    bunker_price_usd: float = Field(default=620.0)


class SimulatorResponse(BaseModel):
    status: str
    baseline: Dict[str, float]
    shocked: Dict[str, float]
    delta: Dict[str, float]
    sensitivity_matrix: List[Dict[str, Any]]
