import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Alert(Base):
    """
    Alert table tracking operational notifications, freight rate volatility spikes,
    berth delays, demurrage warnings, and geopolitical chokepoint alerts.
    """

    __tablename__ = "alerts"

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
    type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="warning",
        doc="Severity type: danger, warning, info, success",
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    impact_metric: Mapped[Optional[str]] = mapped_column(
        String(128),
        nullable=True,
        doc="Quantifiable operational impact, e.g., '+$45,000 demurrage', '+3.5 days idle'",
    )
    action_required: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    is_dismissed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="alerts",
    )

    def __repr__(self) -> str:
        return f"<Alert(id={self.id}, type={self.type}, title={self.title})>"
