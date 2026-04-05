"""
Generic async repository base class.

All domain repositories inherit from this.
It enforces:
  - Soft-delete filtering on every fetch (deleted_at IS NULL)
  - UUID primary keys
  - Consistent patterns for get / list / create / update / soft_delete
"""

import uuid
from datetime import UTC, datetime
from typing import Any, Generic, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, model: type[ModelT], db: AsyncSession) -> None:
        self.model = model
        self.db = db

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _base_query(self) -> Select:
        """Base SELECT with soft-delete guard applied if model supports it."""
        q = select(self.model)
        if issubclass(self.model, SoftDeleteMixin):
            q = q.where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]
        return q

    # ── Reads ─────────────────────────────────────────────────────────────────

    async def get_by_id(self, id: uuid.UUID) -> ModelT | None:
        result = await self.db.execute(
            self._base_query().where(self.model.id == id)  # type: ignore[attr-defined]
        )
        return result.scalar_one_or_none()

    async def get_by_id_or_404(self, id: uuid.UUID) -> ModelT:
        from fastapi import HTTPException, status

        instance = await self.get_by_id(id)
        if instance is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{self.model.__name__} not found.",
            )
        return instance

    async def list(
        self,
        *,
        offset: int = 0,
        limit: int = 20,
        order_by: Any = None,
    ) -> list[ModelT]:
        q = self._base_query()
        if order_by is not None:
            q = q.order_by(order_by)
        q = q.offset(offset).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def count(self) -> int:
        q = select(func.count()).select_from(self.model)
        if issubclass(self.model, SoftDeleteMixin):
            q = q.where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]
        result = await self.db.execute(q)
        return result.scalar_one()

    # ── Writes ────────────────────────────────────────────────────────────────

    async def create(self, data: dict[str, Any]) -> ModelT:
        instance = self.model(**data)
        self.db.add(instance)
        await self.db.flush()   # get DB-generated values (id, timestamps)
        await self.db.refresh(instance)
        return instance

    async def update(self, instance: ModelT, data: dict[str, Any]) -> ModelT:
        for key, value in data.items():
            setattr(instance, key, value)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def soft_delete(self, instance: ModelT) -> ModelT:
        if not isinstance(instance, SoftDeleteMixin):
            raise TypeError(f"{self.model.__name__} does not support soft delete.")
        instance.deleted_at = datetime.now(UTC)  # type: ignore[attr-defined]
        await self.db.flush()
        return instance

    async def hard_delete(self, instance: ModelT) -> None:
        """
        Permanent delete — only use for truly transient data
        (e.g. expired tokens, old notifications).
        """
        await self.db.delete(instance)
        await self.db.flush()
