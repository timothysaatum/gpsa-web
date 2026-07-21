from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.academic_resource import AcademicResource

from sqlalchemy import CheckConstraint, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Course(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    """
    Canonical list of pharmacy courses.
    Academic resources are tagged to a course for structured filtering.
    """

    __tablename__ = "courses"
    __table_args__ = (
        CheckConstraint("level >= 100 AND level <= 600", name="ck_courses_level_range"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    code: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    level: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 100–600

    # Relationships
    academic_resources: Mapped[list[AcademicResource]] = relationship(
        back_populates="course", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<Course id={self.id} name={self.name} level={self.level}>"
