import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import DateTime, ForeignKey, Numeric, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.cargo_request import CargoRequest
    from app.models.report import Report
    from app.models.user import User


class VoyagePlan(Base):
    """
    VoyagePlan table storing optimized vessel recommendations, comprehensive
    freight & idle waiting cost models, and What-If simulator overrides.
    """

    __tablename__ = "voyage_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        index=True,
        nullable=False,
    )
    cargo_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cargo_requests.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    recommended_vessel_class: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Algorithm-recommended vessel class: Capesize, Newcastlemax, Kamsarmax, Panamax, Supramax",
    )
    final_vessel_class: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="User or charterer confirmed vessel class selection",
    )
    vessel_score: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        doc="Optimization score (0.00 - 100.00)",
    )
    freight_cost_usd: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        doc="Total charter freight hire cost in USD",
    )
    port_charges_usd: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        doc="Port dues, pilotage, tuggage, and berth charges in USD",
    )
    loading_discharge_cost_usd: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        doc="Stevedoring, crane hire, and terminal handling charges in USD",
    )
    idle_waiting_cost_usd: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        doc="Projected cost of idle vessel waiting time at anchorage in USD",
    )
    demurrage_exposure_usd: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        doc="Estimated demurrage penalty risk exposure in USD",
    )
    total_cost_usd: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        doc="Sum of freight, port, idle waiting, and handling expenses in USD",
    )
    total_cost_inr: Mapped[Decimal] = mapped_column(
        Numeric(16, 2),
        nullable=False,
        doc="Total voyage landed cost converted to Indian Rupees (INR)",
    )
    cost_per_mt_usd: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        doc="Effective landed cost per Metric Ton in USD",
    )
    freight_rate_per_mt: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        doc="Base maritime freight rate per Metric Ton in USD",
    )
    expected_idle_hours: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        nullable=False,
        default=Decimal("0.00"),
        doc="Predicted waiting hours at anchorage prior to berthing",
    )
    risk_score_overall: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("0.00"),
        doc="Overall risk score (0.00 - 100.00)",
    )
    risk_bucket: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="Low",
        doc="Risk category: Low, Medium, High, Critical",
    )
    simulator_overrides: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
        doc="What-If simulator parameters: congestion, weather, bunker price, and vessel availability overrides",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )

    # Relationships
    cargo_request: Mapped["CargoRequest"] = relationship(
        "CargoRequest",
        back_populates="voyage_plans",
    )
    user: Mapped["User"] = relationship(
        "User",
        back_populates="voyage_plans",
    )
    reports: Mapped[List["Report"]] = relationship(
        "Report",
        back_populates="voyage_plan",
    )

    def __repr__(self) -> str:
        return (
            f"<VoyagePlan(id={self.id}, vessel={self.final_vessel_class}, "
            f"total_usd=${self.total_cost_usd}, risk={self.risk_bucket})>"
        )
