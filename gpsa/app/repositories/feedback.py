import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import FeedbackEntityType
from app.models.feedback import Feedback
from app.repositories.base import BaseRepository


class FeedbackRepository(BaseRepository[Feedback]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Feedback, db)

    async def get_by_user_and_entity(
        self,
        user_id: uuid.UUID,
        entity_type: FeedbackEntityType,
        entity_id: uuid.UUID,
    ) -> Feedback | None:
        result = await self.db.execute(
            select(Feedback).where(
                Feedback.submitted_by == user_id,
                Feedback.entity_type == entity_type,
                Feedback.entity_id == entity_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_summary(
        self, entity_type: FeedbackEntityType, entity_id: uuid.UUID
    ) -> tuple[float, int]:
        """Returns (average_rating, total_count)."""
        result = await self.db.execute(
            select(
                func.avg(Feedback.rating).label("avg"),
                func.count(Feedback.id).label("count"),
            ).where(
                Feedback.entity_type == entity_type,
                Feedback.entity_id == entity_id,
            )
        )
        row = result.one()
        avg = float(row.avg) if row.avg is not None else 0.0
        return round(avg, 2), row.count or 0

    async def list_for_entity(
        self,
        entity_type: FeedbackEntityType,
        entity_id: uuid.UUID,
        offset: int = 0,
        limit: int = 20,
    ) -> list[Feedback]:
        result = await self.db.execute(
            select(Feedback)
            .where(
                Feedback.entity_type == entity_type,
                Feedback.entity_id == entity_id,
            )
            .order_by(Feedback.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())
