import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKeyMixin:
    """UUID v4 primary key — preferred over serial integers for security and portability."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        sort_order=-10,  # always renders first in CREATE TABLE
    )


class TimestampMixin:
    """Automatic created_at / updated_at timestamps (timezone-aware)."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        sort_order=98,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        sort_order=99,
    )


class SoftDeleteMixin:
    """
    Soft-delete support.

    All queries that expose data to end-users MUST filter:
        WHERE deleted_at IS NULL

    This is enforced at the repository base class level.
    """

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        sort_order=100,
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None