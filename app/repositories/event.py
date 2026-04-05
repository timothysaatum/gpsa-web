import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.event import Event, EventRegistration
from app.models.enums import EventStatus, EventType
from app.repositories.base import BaseRepository


class EventRepository(BaseRepository[Event]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Event, db)

    async def list_filtered(
        self,
        *,
        status: EventStatus | None = None,
        event_type: EventType | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[Event]:
        q = self._base_query()
        if status:
            q = q.where(Event.status == status)
        if event_type:
            q = q.where(Event.event_type == event_type)
        q = q.order_by(Event.start_datetime.asc()).offset(offset).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get_featured(self) -> Event | None:
        result = await self.db.execute(
            self._base_query()
            .where(Event.is_featured.is_(True), Event.status != EventStatus.past)
            .order_by(Event.start_datetime.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()


class EventRegistrationRepository(BaseRepository[EventRegistration]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(EventRegistration, db)

    async def get_by_event_and_user(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ) -> EventRegistration | None:
        result = await self.db.execute(
            select(EventRegistration).where(
                EventRegistration.event_id == event_id,
                EventRegistration.user_id == user_id,
                EventRegistration.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_for_event(self, event_id: uuid.UUID) -> list[EventRegistration]:
        result = await self.db.execute(
            select(EventRegistration).where(
                EventRegistration.event_id == event_id,
                EventRegistration.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def count_for_event(self, event_id: uuid.UUID) -> int:
        from sqlalchemy import func, select
        result = await self.db.execute(
            select(func.count()).select_from(EventRegistration).where(
                EventRegistration.event_id == event_id,
                EventRegistration.deleted_at.is_(None),
            )
        )
        return result.scalar_one()
