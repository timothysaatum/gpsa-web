from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Partner(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """Institution or organisation displayed in the public partners section."""

    __tablename__ = "partners"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    logo_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

