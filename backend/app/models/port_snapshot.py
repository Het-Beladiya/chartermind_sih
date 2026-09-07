import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import DateTime, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PortSnapshot(Base):
    """
    PortSnapshot table tracking live operational congestion, anchorage waiting times,
    mechanized handling discharge rates, and weather conditions at East Coast Indian ports.
    Target ports: Paradip, Dhamra, Vizag, Haldia, Kolkata.
    """

    __tablename__ = "port_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        index=True,
        nullable=False,
    )
    port_id: Mapped[str] = mapped_column(
        String(64),
        index=True,
        nullable=False,
        doc="Target East Coast Indian Port: Paradip, Dhamra, Vizag, Haldia, Kolkata",
    )
    congestion_level: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        doc="Congestion status: Low, Medium, High, Critical",
    )
    berthing_wait_days: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        nullable=False,
        doc="Estimated average vessel waiting time at anchorage in days",
    )
    handling_rate_mt_per_day: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        doc="Discharge/loading conveyor productivity in Metric Tons per day",
    )
    weather_risk: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="Low",
        doc="Weather risk level: Low, Medium, High (e.g. Cyclone warnings, monsoon swells)",
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        index=True,
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<PortSnapshot(id={self.id}, port={self.port_id}, "
            f"congestion={self.congestion_level}, wait_days={self.berthing_wait_days}d)>"
        )
