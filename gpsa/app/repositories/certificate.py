import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.certificate import Certificate
from app.repositories.base import BaseRepository


class CertificateRepository(BaseRepository[Certificate]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Certificate, db)

    async def get_by_verification_code(self, code: str) -> Certificate | None:
        result = await self.db.execute(
            select(Certificate)
            .options(
                selectinload(Certificate.event),
                selectinload(Certificate.user),
            )
            .where(Certificate.verification_code == code.upper())
        )
        return result.scalar_one_or_none()

    async def get_for_user_and_event(
        self, user_id: uuid.UUID, event_id: uuid.UUID
    ) -> Certificate | None:
        result = await self.db.execute(
            select(Certificate).where(
                Certificate.user_id == user_id,
                Certificate.event_id == event_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: uuid.UUID) -> list[Certificate]:
        result = await self.db.execute(
            select(Certificate)
            .options(selectinload(Certificate.event))
            .where(Certificate.user_id == user_id)
            .order_by(Certificate.issued_at.desc())
        )
        return list(result.scalars().all())

    async def list_for_event(self, event_id: uuid.UUID) -> list[Certificate]:
        result = await self.db.execute(
            select(Certificate)
            .options(selectinload(Certificate.user))
            .where(Certificate.event_id == event_id)
        )
        return list(result.scalars().all())
