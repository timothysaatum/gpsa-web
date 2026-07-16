import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, SmallInteger, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.db.types import JSONBCompat
from app.models.enums import EventStatus, EventType

if TYPE_CHECKING:
    from app.models.certificate import Certificate
    from app.models.user import User


class Event(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "events"
    __table_args__ = (
        Index("ix_events_status_start", "status", "start_datetime"),
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    event_type: Mapped[EventType] = mapped_column(
        SAEnum(EventType, name="event_type", create_constraint=True),
        nullable=False,
        index=True,
    )
    status: Mapped[EventStatus] = mapped_column(
        SAEnum(EventStatus, name="event_status", create_constraint=True),
        nullable=False,
        default=EventStatus.upcoming,
        index=True,
    )

    # Scheduling
    start_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    location: Mapped[str] = mapped_column(String(500), nullable=False)

    # Presentation
    banner_emoji: Mapped[str | None] = mapped_column(String(10), nullable=True)
    banner_image_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Rich content
    agenda: Mapped[dict | None] = mapped_column(JSONBCompat, nullable=True)
    speakers: Mapped[list | None] = mapped_column(JSONBCompat, nullable=True)

    # Attribution
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    registrations: Mapped[list["EventRegistration"]] = relationship(
        back_populates="event", cascade="all, delete-orphan", lazy="noload"
    )
    certificates: Mapped[list["Certificate"]] = relationship(  # type: ignore[name-defined]
        back_populates="event", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<Event id={self.id} title={self.title!r} status={self.status}>"


class EventRegistration(UUIDPrimaryKeyMixin, SoftDeleteMixin, Base):
    __tablename__ = "event_registrations"
    __table_args__ = (
        Index("ix_event_registrations_event_user", "event_id", "user_id"),
        Index(
            "ix_event_registrations_active_unique",
            "event_id",
            "user_id",
            unique=True,
            postgresql_where=("user_id IS NOT NULL AND deleted_at IS NULL"),
        ),
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Nullable — guest registrations (non-logged-in) are allowed
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Captured at registration time (denormalised intentionally — user data can change)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    level: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    event: Mapped["Event | None"] = relationship(back_populates="registrations")
    user: Mapped["User | None"] = relationship(back_populates="event_registrations")  # type: ignore[name-defined]
    certificate: Mapped["Certificate | None"] = relationship(  # type: ignore[name-defined]
        back_populates="registration", uselist=False, lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<EventRegistration id={self.id} event_id={self.event_id} name={self.full_name!r}>"
