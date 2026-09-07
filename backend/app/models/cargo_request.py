import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.voyage_plan import VoyagePlan


class CargoRequest(Base):
    """
    CargoRequest table representing bulk cargo shipping demands.
    Bulk commodities (Coal, Iron Ore, Bauxite, Grain) from origins like Australia,
    Indonesia, South Africa, Mozambique, Russia to East Coast Indian ports:
    Paradip, Dhamra, Vizag, Haldia, Kolkata.
    """

    __tablename__ = "cargo_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        index=True,
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    cargo_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Commodity type: Coal, Iron Ore, Bauxite, Grain",
    )
    cargo_quantity_mt: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        doc="Cargo volume in Metric Tons",
    )
    origin_country: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="Origin country: Australia, Indonesia, South Africa, Mozambique, Russia, etc.",
    )
    destination_port: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        doc="East Coast Indian port: Paradip, Dhamra, Vizag, Haldia, Kolkata",
    )
    required_delivery_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    loading_window_start: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    loading_window_end: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    discharge_window_start: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    discharge_window_end: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    preferred_vessel_type: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        doc="Preferred vessel class: Capesize, Panamax, Supramax, Handymax",
    )
    max_acceptable_freight: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2),
        nullable=True,
        doc="Maximum ceiling freight rate (USD/MT)",
    )
    number_of_voyages: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    contract_duration: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        doc="Spot, 3 Months, 6 Months, 1 Year CoA",
    )
    priority: Mapped[str] = mapped_column(
        String(32),
        default="medium",
        nullable=False,
        doc="Priority: low, medium, high, critical",
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="draft",
        nullable=False,
        doc="Status: draft, active, completed, cancelled",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="cargo_requests",
    )
    voyage_plans: Mapped[List["VoyagePlan"]] = relationship(
        "VoyagePlan",
        back_populates="cargo_request",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<CargoRequest(id={self.id}, cargo={self.cargo_type}, "
            f"qty={self.cargo_quantity_mt}MT, {self.origin_country} -> {self.destination_port})>"
        )
