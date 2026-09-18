import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, DateTime, String, func, text
from app.database import SERVER_UUID_DEFAULT, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.alert import Alert
    from app.models.cargo_request import CargoRequest
    from app.models.report import Report
    from app.models.voyage_plan import VoyagePlan


class User(Base):
    """User table mapped to Firebase Authentication identities."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=SERVER_UUID_DEFAULT,
        index=True,
        nullable=False,
    )
    firebase_uid: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=False,
        doc="Firebase Unique Identifier",
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    company: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        default="Maritime Logistics Corp",
    )
    role: Mapped[str] = mapped_column(
        String(64),
        default="charterer",
        nullable=False,
        doc="User maritime role: charterer, ship_owner, broker, port_authority, admin",
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(512),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("1"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    cargo_requests: Mapped[List["CargoRequest"]] = relationship(
        "CargoRequest",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    voyage_plans: Mapped[List["VoyagePlan"]] = relationship(
        "VoyagePlan",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    alerts: Mapped[List["Alert"]] = relationship(
        "Alert",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    reports: Mapped[List["Report"]] = relationship(
        "Report",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    @property
    def full_name(self) -> Optional[str]:
        """Backward compatibility alias for name."""
        return self.name

    @full_name.setter
    def full_name(self, value: Optional[str]) -> None:
        self.name = value

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
