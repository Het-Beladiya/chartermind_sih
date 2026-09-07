from typing import List, Literal
from pydantic import BaseModel, ConfigDict, Field

ImpactLevel = Literal["Low", "Medium", "High"]
ShiftDirection = Literal["up", "down"]


class IdleFactor(BaseModel):
    name: str = Field(..., description="Operational driver (e.g. Berth Queue, Monsoon Swells, Conveyor Breakdown)")
    impact: ImpactLevel = Field(..., description="Severity level of the factor")
    hours: float = Field(..., description="Marginal idle waiting hours induced or saved")
    direction: ShiftDirection = Field(..., description="'up' for delays, 'down' for expedited turnaround")

    model_config = ConfigDict(from_attributes=True)


class IdlePredictionResult(BaseModel):
    expected_idle_hours: float = Field(..., description="Projected cumulative idle waiting hours at anchorage")
    idle_cost_usd: float = Field(..., description="Direct bunker and vessel hire cost accrued while idle (USD)")
    factors: List[IdleFactor] = Field(default_factory=list, description="Granular breakdown of idle waiting drivers")
    explanation: str = Field(..., description="Operational context and berth assignment forecast")

    model_config = ConfigDict(from_attributes=True)
