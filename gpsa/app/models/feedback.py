from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User

from sqlalchemy import CheckConstraint, ForeignKey, Index, SmallInteger, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import UUIDPrimaryKeyMixin
from app.models.enums import FeedbackEntityType


class Feedback(UUIDPrimaryKeyMixin, Base):
    """
    Student ratings and comments on events, academic resources, and opportunities.

    Uses a polymorphic pattern — entity_type + entity_id point to any supported table.
    This is the single source of truth; no redundant per-entity FKs exist.

    rating is 1–5 enforced by a DB check constraint.
    No soft delete — feedback is a permanent record.
    """

    __tablename__ = "feedback"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_feedback_rating_range"),
        Index("ix_feedback_entity", "entity_type", "entity_id"),
    )

    entity_type: Mapped[FeedbackEntityType] = mapped_column(
        SAEnum(FeedbackEntityType, name="feedback_entity_type", create_constraint=True),
        nullable=False,
        index=True,
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    submitted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    submitted_by_user: Mapped[User] = relationship(
        back_populates="feedback",
    )

    def __repr__(self) -> str:
        return (
            f"<Feedback id={self.id} entity={self.entity_type}/{self.entity_id} "
            f"rating={self.rating}>"
        )
