import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Enum as SAEnum, ForeignKey, SmallInteger, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import UUIDPrimaryKeyMixin
from app.models.enums import FeedbackEntityType


class Feedback(UUIDPrimaryKeyMixin, Base):
    """
    Student ratings and comments on events, academic resources, and opportunities.

    Uses a polymorphic pattern — entity_type + entity_id point to any supported table.
    Foreign keys to individual tables are nullable and used only for JOIN convenience.
    The source of truth is (entity_type, entity_id).

    rating is 1–5 enforced by a DB check constraint.
    No soft delete — feedback is a permanent record.
    """

    __tablename__ = "feedback"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_feedback_rating_range"),
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

    submitted_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=func.now(),
    )

    # Convenience FK relationships — nullable because entity may vary
    event_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=True,
    )
    academic_resource_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("academic_resources.id", ondelete="CASCADE"),
        nullable=True,
    )

    # Relationships
    submitted_by_user: Mapped["User"] = relationship(  # type: ignore[name-defined]
        back_populates="feedback",
    )
    event: Mapped["Event | None"] = relationship(  # type: ignore[name-defined]
        back_populates="feedback",
        foreign_keys=[event_id],
    )
    academic_resource: Mapped["AcademicResource | None"] = relationship(  # type: ignore[name-defined]
        back_populates="feedback",
        foreign_keys=[academic_resource_id],
    )

    def __repr__(self) -> str:
        return (
            f"<Feedback id={self.id} entity={self.entity_type}/{self.entity_id} "
            f"rating={self.rating}>"
        )
