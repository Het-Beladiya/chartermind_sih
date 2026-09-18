import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import Date, DateTime, Numeric, String, func, text
from app.database import SERVER_UUID_DEFAULT, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class FreightRate(Base):
    """
    FreightRate table storing historical and spot freight market rate indices.
    E.g., Indonesia -> Paradip (Thermal Coal), Australia -> Dhamra (Coking Coal),
    Mozambique -> Vizag, Russia -> Paradip.
    """

    __tablename__ = "freight_rates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=SERVER_UUID_DEFAULT,
        index=True,
        nullable=False,
    )
    route: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
        doc="Trade corridor name, e.g., 'Indonesia -> Paradip', 'Australia -> Vizag'",
    )
    origin: Mapped[str] = mapped_column(
        String(128),
        index=True,
        nullable=False,
        doc="Origin country or loading port, e.g., 'Indonesia', 'Gladstone, Australia'",
    )
    destination: Mapped[str] = mapped_column(
        String(128),
        index=True,
        nullable=False,
        doc="Discharge port: 'Paradip', 'Dhamra', 'Vizag', 'Haldia', 'Kolkata'",
    )
    cargo_type: Mapped[str] = mapped_column(
        String(64),
        index=True,
        nullable=False,
        doc="Commodity: Coal, Iron Ore, Bauxite, Grain",
    )
    rate_usd_per_mt: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        doc="Freight rate in USD per Metric Ton",
    )
    date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False,
        doc="Effective date of the rate quote or historical benchmark",
    )
    source: Mapped[str] = mapped_column(
        String(128),
        default="Baltic Exchange",
        nullable=False,
        doc="Market data source, e.g., 'Baltic Exchange', 'SSY', 'Clarksons', 'Manual Seed'",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<FreightRate(id={self.id}, route={self.route}, "
            f"rate=${self.rate_usd_per_mt}/MT, date={self.date})>"
        )
