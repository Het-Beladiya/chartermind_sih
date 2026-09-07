import uuid
from datetime import datetime
from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

ReportType = Literal["voyage_cost", "forecast", "risk", "contract"]


class ReportCreate(BaseModel):
    voyage_plan_id: Optional[uuid.UUID] = Field(None, description="Optional linked voyage plan ID")
    title: str = Field(..., description="Report title")
    report_type: ReportType = Field(..., description="Classification: voyage_cost, forecast, risk, contract")
    content_json: Dict[str, Any] = Field(default_factory=dict, description="Full report payload data")


class ReportResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    voyage_plan_id: Optional[uuid.UUID] = None
    title: str
    report_type: ReportType
    content_json: Dict[str, Any]
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)
