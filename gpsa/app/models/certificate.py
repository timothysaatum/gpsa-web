import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.event import Event, EventRegistration
    from app.models.user import User


class Certificate(UUIDPrimaryKeyMixin, Base):
    """
    Attendance/participation certificate issued per event per student.

    verification_code is a short public code (e.g. GPSA-2025-XK9T)
    that anyone can use to verify a certificate's authenticity
    without needing an account.

    certificate_key is the R2/S3 object key for the generated PDF.

    No soft delete — issued certificates are permanent records.
    """

    __tablename__ = "certificates"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    registration_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("event_registrations.id", ondelete="SET NULL"),
        nullable=True,
    )

    # The short public verification code printed on the certificate
    verification_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )

    # R2/S3 key for the generated PDF
    certificate_key: Mapped[str] = mapped_column(String(1000), nullable=False)

    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    event: Mapped["Event"] = relationship(back_populates="certificates")  # type: ignore[name-defined]
    user: Mapped["User | None"] = relationship(back_populates="certificates")  # type: ignore[name-defined]
    registration: Mapped["EventRegistration | None"] = relationship(  # type: ignore[name-defined]
        back_populates="certificate",
    )

    def __repr__(self) -> str:
        return (
            f"<Certificate id={self.id} event_id={self.event_id} "
            f"user_id={self.user_id} code={self.verification_code}>"
        )
