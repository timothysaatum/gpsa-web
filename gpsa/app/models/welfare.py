import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ReportStatus, ReportType, WelfareCategory


class WelfareReport(UUIDPrimaryKeyMixin, SoftDeleteMixin, Base):
    """
    PharmaCare submission — issue, support request, or confidential report.

    IMPORTANT: There is intentionally NO user_id foreign key here.
    Anonymous/confidential submissions must be structurally detached
    from the users table — not just a nullable FK.

    The API layer additionally strips IP/user-agent for confidential submissions.
    """

    __tablename__ = "welfare_reports"

    report_type: Mapped[ReportType] = mapped_column(
        SAEnum(ReportType, name="report_type", create_constraint=True),
        nullable=False,
        index=True,
    )
    category: Mapped[WelfareCategory] = mapped_column(
        SAEnum(WelfareCategory, name="welfare_category", create_constraint=True),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Optional identity — only populated for non-anonymous submissions
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    level: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    contact: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Attachment (R2/S3 key)
    attachment_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Workflow
    status: Mapped[ReportStatus] = mapped_column(
        SAEnum(ReportStatus, name="report_status", create_constraint=True),
        nullable=False,
        default=ReportStatus.pending,
        index=True,
    )
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return (
            f"<WelfareReport id={self.id} type={self.report_type} "
            f"status={self.status} anonymous={self.is_anonymous}>"
        )


class WelfareSpotlight(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """
    'Issue of the Week' — admin-curated anonymous highlight to show action is being taken.
    Only one record can be active at a time (enforced in the service layer).
    """

    __tablename__ = "welfare_spotlight"

    summary: Mapped[str] = mapped_column(Text, nullable=False)
    action_taken: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<WelfareSpotlight id={self.id} active={self.is_active}>"
