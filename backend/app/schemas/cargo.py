import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

CargoType = Literal["Coal", "Iron Ore", "Bauxite", "Grain"]
OriginCountry = Literal["Australia", "Indonesia", "South Africa", "Mozambique", "Russia", "Other"]
DestinationPort = Literal["Paradip", "Dhamra", "Vizag", "Haldia", "Kolkata"]
VesselClass = Literal["Capesize", "Panamax", "Supramax", "Handysize"]
CargoPriority = Literal["low", "medium", "high", "critical"]
CargoStatus = Literal["draft", "active", "completed", "cancelled"]


class CargoRequestBase(BaseModel):
    cargo_type: CargoType = Field(..., description="Commodity type")
    cargo_quantity_mt: Decimal = Field(..., gt=0, description="Cargo quantity in Metric Tons")
    origin_country: str = Field(..., description="Overseas origin (Australia, Indonesia, South Africa, Mozambique, Russia, etc.)")
    destination_port: DestinationPort = Field(..., description="Target East Coast Indian Port")
    required_delivery_date: Optional[date] = Field(None, description="Target arrival or delivery date")
    loading_window_start: Optional[date] = Field(None, description="Earliest loading laycan start")
    loading_window_end: Optional[date] = Field(None, description="Latest loading laycan cancellation date")
    discharge_window_start: Optional[date] = Field(None, description="Earliest discharge window date")
    discharge_window_end: Optional[date] = Field(None, description="Latest discharge window date")
    preferred_vessel_type: Optional[VesselClass] = Field(None, description="Preferred vessel class")
    max_acceptable_freight: Optional[Decimal] = Field(None, gt=0, description="Ceiling freight rate in USD/MT")
    number_of_voyages: int = Field(1, ge=1, description="Number of voyages required")
    contract_duration: Optional[str] = Field("Spot", description="Spot or Contract of Affreightment (CoA) duration")
    priority: CargoPriority = Field("medium", description="Operational shipment priority")


class CargoRequestCreate(CargoRequestBase):
    pass


class CargoRequestUpdate(BaseModel):
    cargo_type: Optional[CargoType] = None
    cargo_quantity_mt: Optional[Decimal] = Field(None, gt=0)
    origin_country: Optional[str] = None
    destination_port: Optional[DestinationPort] = None
    required_delivery_date: Optional[date] = None
    loading_window_start: Optional[date] = None
    loading_window_end: Optional[date] = None
    discharge_window_start: Optional[date] = None
    discharge_window_end: Optional[date] = None
    preferred_vessel_type: Optional[VesselClass] = None
    max_acceptable_freight: Optional[Decimal] = Field(None, gt=0)
    number_of_voyages: Optional[int] = Field(None, ge=1)
    contract_duration: Optional[str] = None
    priority: Optional[CargoPriority] = None
    status: Optional[CargoStatus] = None


class CargoRequestResponse(CargoRequestBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: CargoStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
