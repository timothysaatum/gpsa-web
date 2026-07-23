from typing import Any

from sqlalchemy import JSON, Boolean, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class CmsPage(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Editable page-level copy and presentation metadata.

    Repeatable domain records (leaders, awards, milestones, etc.) remain in
    normalized tables. This model owns page headings, introductions, CTAs and
    media references that do not warrant their own table.
    """

    __tablename__ = "cms_pages"

    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), nullable=False, default=dict
    )
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
