import uuid
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.voyage import SimulatorOverrides

ContractStrategy = Literal["Multiple-Voyage", "Spot"]


class ContractComparisonResult(BaseModel):
    recommended_strategy: ContractStrategy = Field(..., description="Recommended charter contract model")
    spot_total_cost_usd: float = Field(..., description="Projected cumulative cost fixing spot voyages (USD)")
    multi_voyage_total_cost_usd: float = Field(..., description="Projected cost under fixed CoA / Multiple-Voyage (USD)")
    savings_usd: float = Field(..., description="Net absolute savings in USD")
    savings_inr: float = Field(..., description="Net absolute savings in INR")
    savings_lakhs: float = Field(..., description="Net savings in INR Lakhs (₹)")
    savings_percent: float = Field(..., description="Percentage savings relative to spot fixing (%)")
    spot_risk_score: float = Field(..., ge=0.0, le=100.0, description="Risk index for open spot exposure")
    multi_voyage_risk_score: float = Field(..., ge=0.0, le=100.0, description="Risk index under multiple voyage contract")
    spot_freight_rate_per_mt: float = Field(..., description="Average expected spot freight (USD/MT)")
    multi_voyage_freight_rate_per_mt: float = Field(..., description="Contracted CoA freight rate (USD/MT)")
    reasoning: str = Field(..., description="Economic and fleet positioning justification")

    model_config = ConfigDict(from_attributes=True)


class ContractCompareRequest(BaseModel):
    cargo_request_id: uuid.UUID = Field(..., description="Cargo request ID to analyze contract strategies for")
    simulator_overrides: Optional[SimulatorOverrides] = Field(default_factory=SimulatorOverrides)
