import uuid
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

AlertType = Literal["danger", "warning", "info", "success"]


class AlertBase(BaseModel):
    type: AlertType = Field(..., description="Alert severity level: danger, warning, info, success")
    title: str = Field(..., description="Brief alert title or summary header")
    message: str = Field(..., description="Detailed operational alert body")
    impact_metric: Optional[str] = Field(None, description="Quantified business impact (e.g. '+$15,000 demurrage')")
    action_required: bool = Field(False, description="Whether immediate charterer action is needed")


class AlertCreate(AlertBase):
    user_id: Optional[uuid.UUID] = Field(None, description="Target user ID. If omitted, resolved from session.")


class AlertResponse(AlertBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_dismissed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
