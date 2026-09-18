import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional
from sqlalchemy import DateTime, ForeignKey, String, func, text
from app.database import JSONB, SERVER_JSON_DEFAULT, SERVER_UUID_DEFAULT, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.voyage_plan import VoyagePlan


class Report(Base):
    """
    Report table archiving generated charter evaluation reports, cost breakdowns,
    risk dossiers, and contract audit summaries.
    """

    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=SERVER_UUID_DEFAULT,
        index=True,
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    voyage_plan_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("voyage_plans.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    report_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="Report classification: voyage_cost, forecast, risk, contract",
    )
    content_json: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=SERVER_JSON_DEFAULT,
        doc="Full structured payload of the generated report",
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="reports",
    )
    voyage_plan: Mapped[Optional["VoyagePlan"]] = relationship(
        "VoyagePlan",
        back_populates="reports",
    )

    def __repr__(self) -> str:
        return f"<Report(id={self.id}, type={self.report_type}, title={self.title})>"
