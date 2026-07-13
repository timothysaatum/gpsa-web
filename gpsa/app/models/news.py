import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.db.types import JSONBCompat
from app.models.enums import NewsCategory

if TYPE_CHECKING:
    from app.models.user import User


class NewsPost(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """
    Official GPSA-UDS news and announcements.

    published_at = None  → draft (not visible to public)
    published_at = set   → live

    is_strip_announcement feeds the scrolling marquee on the homepage.
    """

    __tablename__ = "news_posts"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[NewsCategory] = mapped_column(
        SAEnum(NewsCategory, name="news_category", create_constraint=True),
        nullable=False,
        index=True,
    )

    # summary = 2–3 line card preview; body = full post content
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Presentation
    banner_emoji: Mapped[str | None] = mapped_column(String(10), nullable=True)
    image_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Flags
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_strip_announcement: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Attachments — stored as array of R2/S3 object keys
    attachments: Mapped[list | None] = mapped_column(JSONBCompat, nullable=True)

    # Publishing workflow
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    # Attribution
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    author: Mapped["User | None"] = relationship(  # type: ignore[name-defined]
        back_populates="news_posts",
        foreign_keys=[author_id],
    )

    @property
    def is_published(self) -> bool:
        return self.published_at is not None

    def __repr__(self) -> str:
        return f"<NewsPost id={self.id} title={self.title!r} published={self.is_published}>"
