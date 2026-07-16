from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class HeroSlide(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "hero_slides"

    image_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    tag: Mapped[str] = mapped_column(String(100), nullable=False)
    heading: Mapped[str] = mapped_column(String(200), nullable=False)
    highlight: Mapped[str] = mapped_column(String(200), nullable=False)
    sub: Mapped[str] = mapped_column(Text, nullable=False)
    primary_button_label: Mapped[str] = mapped_column(String(100), nullable=False)
    primary_button_path: Mapped[str] = mapped_column(String(500), nullable=False)
    secondary_button_label: Mapped[str] = mapped_column(String(100), nullable=False)
    secondary_button_path: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<HeroSlide id={self.id} tag={self.tag!r} heading={self.heading!r}>"
