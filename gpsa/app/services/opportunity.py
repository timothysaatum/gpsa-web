"""
Opportunity service — coordinates repositories, permissions, audit, and
background notifications for the opportunity lifecycle.
"""

import uuid
from datetime import UTC, date, datetime
from typing import Any

import structlog
from fastapi import HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import assert_permission, can_post_opportunity, can_publish_opportunity
from app.domain.bus import bus as domain_bus
from app.domain.events import OpportunityCreated
from app.domain.kernel import DomainEventBus
from app.models.enums import OpportunityType, UserRole
from app.models.opportunity import Opportunity
from app.models.user import User
from app.repositories.base import BaseRepository
from app.services.audit import AuditService

logger = structlog.get_logger(__name__)


class OpportunityRepository(BaseRepository[Opportunity]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Opportunity, db)

    async def list_filtered(
        self,
        *,
        opp_type: OpportunityType | None = None,
        active_only: bool = True,
        offset: int = 0,
        limit: int = 20,
    ) -> list[Opportunity]:
        q = self._base_query().where(Opportunity.is_published.is_(True))
        if active_only:
            q = q.where(Opportunity.is_active.is_(True))
        if opp_type:
            q = q.where(Opportunity.opp_type == opp_type)
        q = q.order_by(Opportunity.deadline.asc()).offset(offset).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def count_filtered(
        self,
        *,
        opp_type: OpportunityType | None = None,
        active_only: bool = True,
    ) -> int:
        q = (
            select(func.count())
            .select_from(Opportunity)
            .where(
                Opportunity.deleted_at.is_(None),
                Opportunity.is_published.is_(True),
            )
        )
        if active_only:
            q = q.where(Opportunity.is_active.is_(True))
        if opp_type:
            q = q.where(Opportunity.opp_type == opp_type)
        result = await self.db.execute(q)
        return result.scalar_one()


class OpportunityService:
    def __init__(self, db: AsyncSession, bus: DomainEventBus | None = None) -> None:
        self.db = db
        self.repo = OpportunityRepository(db)
        self.audit = AuditService(db)
        self.bus = bus or domain_bus

    async def list_filtered(
        self,
        opp_type: OpportunityType | None = None,
        include_expired: bool = False,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Opportunity], int]:
        active_only = not include_expired
        opps = await self.repo.list_filtered(
            opp_type=opp_type, active_only=active_only, offset=offset, limit=limit
        )
        total = await self.repo.count_filtered(opp_type=opp_type, active_only=active_only)
        return opps, total

    async def get_by_id(self, opp_id: uuid.UUID) -> Opportunity:
        opp = await self.repo.get_by_id_or_404(opp_id)
        if not opp.is_published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found.")
        return opp

    async def create(
        self,
        payload: dict[str, Any],
        actor: User,
        request: Request,
    ) -> Opportunity:
        assert_permission(can_post_opportunity(actor))

        deadline = payload["deadline"]
        if deadline < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deadline cannot be in the past.",
            )

        data = {
            **payload,
            "is_active": True,
            "is_published": actor.role == UserRole.admin,
            "posted_by": actor.id,
            "reviewed_by": actor.id if actor.role == UserRole.admin else None,
            "reviewed_at": datetime.now(UTC) if actor.role == UserRole.admin else None,
        }
        opp = await self.repo.create(data)
        await self.audit.log(
            action="CREATE", entity_type="opportunity",
            entity_id=opp.id, new_values={"title": opp.title}, request=request,
        )
        await self.db.commit()
        await self.bus.publish_async(OpportunityCreated(
            opportunity_id=opp.id, title=opp.title,
        ))
        return opp

    async def update(
        self,
        opp_id: uuid.UUID,
        updates: dict,
        actor: User,
        request: Request,
    ) -> Opportunity:
        assert_permission(can_post_opportunity(actor))
        opp = await self.repo.get_by_id_or_404(opp_id)

        if "is_published" in updates and not can_publish_opportunity(actor):
            raise HTTPException(status_code=403, detail="Only admins can publish opportunities.")

        old_values = {k: str(getattr(opp, k)) for k in updates}
        opp = await self.repo.update(opp, updates)
        await self.audit.log(
            action="UPDATE", entity_type="opportunity", entity_id=opp.id,
            old_values=old_values, new_values={k: str(v) for k, v in updates.items()},
            request=request,
        )
        await self.db.commit()
        return opp

    async def delete(self, opp_id: uuid.UUID, request: Request) -> None:
        opp = await self.repo.get_by_id_or_404(opp_id)
        await self.repo.soft_delete(opp)
        await self.audit.log(
            action="DELETE", entity_type="opportunity", entity_id=opp.id, request=request
        )
        await self.db.commit()
