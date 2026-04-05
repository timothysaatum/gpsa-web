import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import UUIDPrimaryKeyMixin


class AuditLog(UUIDPrimaryKeyMixin, Base):
    """
    Immutable record of every mutation in the system.

    Rules:
    - No updated_at, no deleted_at — audit logs are append-only.
    - actor_id is nullable to support system-triggered actions (schedulers, etc.).
    - old_values / new_values store JSONB snapshots for diffing.
    - Correlate with request logs via request_id.
    """

    __tablename__ = "audit_logs"

    # Who
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # What
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        # Examples: CREATE, UPDATE, DELETE, LOGIN, LOGOUT,
        #           SUBMIT, APPROVE, REJECT, PUBLISH, REVOKE
    )
    entity_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        # Examples: user, welfare_report, event, opportunity, news_post
    )
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    # Data snapshot
    old_values: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_values: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Request context
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    actor: Mapped["User | None"] = relationship(  # type: ignore[name-defined]
        back_populates="audit_logs",
        foreign_keys=[actor_id],
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog id={self.id} action={self.action} "
            f"entity={self.entity_type}/{self.entity_id}>"
        )
