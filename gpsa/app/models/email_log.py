import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import UUIDPrimaryKeyMixin
from app.models.enums import EmailStatus, EmailTemplate


class EmailLog(UUIDPrimaryKeyMixin, Base):
    """
    Record of every outbound email — enables debugging and retry logic.
    No deleted_at: email logs are immutable audit artifacts.
    """

    __tablename__ = "email_logs"
    __table_args__ = (Index("ix_email_logs_status_created", "status", "created_at"),)

    recipient: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    template: Mapped[EmailTemplate] = mapped_column(
        SAEnum(EmailTemplate, name="email_template", create_constraint=True),
        nullable=False,
    )
    subject: Mapped[str] = mapped_column(String(500), nullable=False)

    # What triggered this email
    entity_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    # The rendered HTML body — stored for retry purposes
    html_body: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Delivery tracking
    status: Mapped[EmailStatus] = mapped_column(
        SAEnum(EmailStatus, name="email_status", create_constraint=True),
        nullable=False,
        default=EmailStatus.pending,
        index=True,
    )
    provider_message_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    retry_count: Mapped[int] = mapped_column(default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<EmailLog id={self.id} to={self.recipient} template={self.template} status={self.status}>"
