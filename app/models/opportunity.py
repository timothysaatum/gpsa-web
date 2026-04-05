import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import OpportunityType


class Opportunity(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "opportunities"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    organization: Mapped[str] = mapped_column(String(255), nullable=False)
    opp_type: Mapped[OpportunityType] = mapped_column(
        SAEnum(OpportunityType, name="opportunity_type", create_constraint=True),
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    deadline: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    external_link: Mapped[str] = mapped_column(String(2048), nullable=False)

    # Visibility
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Auto-managed by background scheduler — set False once deadline passes
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    # Moderation
    posted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        return f"<Opportunity id={self.id} title={self.title!r} deadline={self.deadline}>"
