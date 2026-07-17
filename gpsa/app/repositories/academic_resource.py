import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.academic_resource import AcademicResource
from app.models.course import Course
from app.models.enums import ContentType, Trimester
from app.repositories.base import BaseRepository

SORTABLE_FIELDS = {
    "title": AcademicResource.title,
    "level": AcademicResource.level,
    "created_at": AcademicResource.created_at,
    "file_size": AcademicResource.file_size_bytes,
}


def _apply_sort(q, sort_by: str | None, sort_order: str | None):
    column = SORTABLE_FIELDS.get(sort_by) if sort_by else None
    if column is None:
        return q.order_by(AcademicResource.created_at.desc())
    order_fn = getattr(column, sort_order if sort_order in ("asc", "desc") else "desc")
    return q.order_by(order_fn())


class CourseRepository(BaseRepository[Course]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Course, db)

    async def get_by_code(self, code: str) -> Course | None:
        result = await self.db.execute(
            self._base_query().where(Course.code == code.upper())
        )
        return result.scalar_one_or_none()

    async def list_by_level(self, level: int) -> list[Course]:
        result = await self.db.execute(
            self._base_query()
            .where(Course.level == level)
            .order_by(Course.name)
        )
        return list(result.scalars().all())


class AcademicResourceRepository(BaseRepository[AcademicResource]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(AcademicResource, db)

    async def list_filtered(
        self,
        *,
        level: int | None = None,
        trimester: Trimester | None = None,
        content_type: ContentType | None = None,
        course_id: uuid.UUID | None = None,
        published_only: bool = True,
        search: str | None = None,
        is_featured: bool | None = None,
        sort_by: str | None = None,
        sort_order: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[AcademicResource]:
        q = self._base_query().options(selectinload(AcademicResource.course))

        if published_only:
            q = q.where(AcademicResource.is_published.is_(True))
        if level is not None:
            q = q.where(AcademicResource.level == level)
        if trimester is not None:
            q = q.where(AcademicResource.trimester == trimester)
        if content_type is not None:
            q = q.where(AcademicResource.content_type == content_type)
        if course_id is not None:
            q = q.where(AcademicResource.course_id == course_id)
        if search:
            q = q.where(AcademicResource.title.ilike(f"%{search}%"))
        if is_featured is not None:
            q = q.where(AcademicResource.is_featured.is_(is_featured))

        q = _apply_sort(q, sort_by, sort_order)
        q = q.offset(offset).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def count_filtered(
        self,
        *,
        level: int | None = None,
        trimester: Trimester | None = None,
        content_type: ContentType | None = None,
        course_id: uuid.UUID | None = None,
        published_only: bool = True,
        search: str | None = None,
        is_featured: bool | None = None,
    ) -> int:
        q = select(func.count()).select_from(AcademicResource).where(
            AcademicResource.deleted_at.is_(None)
        )

        if published_only:
            q = q.where(AcademicResource.is_published.is_(True))
        if level is not None:
            q = q.where(AcademicResource.level == level)
        if trimester is not None:
            q = q.where(AcademicResource.trimester == trimester)
        if content_type is not None:
            q = q.where(AcademicResource.content_type == content_type)
        if course_id is not None:
            q = q.where(AcademicResource.course_id == course_id)
        if search:
            q = q.where(AcademicResource.title.ilike(f"%{search}%"))
        if is_featured is not None:
            q = q.where(AcademicResource.is_featured.is_(is_featured))

        result = await self.db.execute(q)
        return result.scalar_one()

    async def get_with_course(self, resource_id: uuid.UUID) -> AcademicResource | None:
        result = await self.db.execute(
            self._base_query()
            .options(selectinload(AcademicResource.course))
            .where(AcademicResource.id == resource_id)
        )
        return result.scalar_one_or_none()
