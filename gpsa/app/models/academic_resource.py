import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, Enum as SAEnum, ForeignKey, Index, SmallInteger, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ContentType, FileType, Trimester


class AcademicResource(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """
    A single uploadable resource (slide deck, exam question set, video, etc.)
    filtered by level → trimester → course → content_type.
    """

    __tablename__ = "academic_resources"
    __table_args__ = (
        Index("ix_academic_resources_course_level_trimester", "course_id", "level", "trimester"),
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[ContentType] = mapped_column(
        SAEnum(ContentType, name="content_type", create_constraint=True),
        nullable=False,
        index=True,
    )

    # Classification
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    level: Mapped[int] = mapped_column(SmallInteger, nullable=False, index=True)
    trimester: Mapped[Trimester] = mapped_column(
        SAEnum(Trimester, name="trimester", create_constraint=True),
        nullable=False,
        index=True,
    )

    # File metadata (object stored in R2/S3 — URL resolved at API layer)
    file_key: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_type: Mapped[FileType] = mapped_column(
        SAEnum(FileType, name="file_type", create_constraint=True),
        nullable=False,
    )
    mime_type: Mapped[str] = mapped_column(String(127), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    duration_mins: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)  # videos only

    # Visibility
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # "Best Sample"
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Attribution
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="academic_resources")  # type: ignore[name-defined]
    uploaded_by_user: Mapped["User | None"] = relationship(  # type: ignore[name-defined]
        back_populates="uploaded_resources",
        foreign_keys=[uploaded_by],
    )
    def __repr__(self) -> str:
        return f"<AcademicResource id={self.id} title={self.title!r} type={self.content_type}>"
