"""
Opportunities — schemas, repository, service, routes.
"""

import uuid
from datetime import UTC, date, datetime
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import AnyHttpUrl, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.core.permissions import assert_permission, can_post_opportunity, can_publish_opportunity
from app.db.session import get_db
from app.models.enums import OpportunityType, UserRole
from app.models.opportunity import Opportunity
from app.repositories.base import BaseRepository
from app.schemas.common import AppModel, MessageResponse, PaginatedResponse
from app.services.audit import AuditService

logger = structlog.get_logger(__name__)


# ── Schemas ───────────────────────────────────────────────────────────────────

class OpportunityCreateRequest(AppModel):
    title: str = Field(min_length=3, max_length=500)
    organization: str = Field(min_length=2, max_length=255)
    opp_type: OpportunityType
    description: str = Field(min_length=10)
    location: str | None = Field(default=None, max_length=255)
    deadline: date
    external_link: str = Field(max_length=2048)


class OpportunityUpdateRequest(AppModel):
    title: str | None = Field(default=None, max_length=500)
    organization: str | None = Field(default=None, max_length=255)
    opp_type: OpportunityType | None = None
    description: str | None = None
    location: str | None = None
    deadline: date | None = None
    external_link: str | None = None
    is_published: bool | None = None


class OpportunityResponse(AppModel):
    id: uuid.UUID
    title: str
    organization: str
    opp_type: OpportunityType
    description: str
    location: str | None
    deadline: date
    external_link: str
    is_active: bool
    is_published: bool
    created_at: datetime


# ── Repository ────────────────────────────────────────────────────────────────

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


# ── Routes ────────────────────────────────────────────────────────────────────

router = APIRouter(tags=["Opportunities"])


@router.get(
    "/",
    response_model=PaginatedResponse[OpportunityResponse],
    summary="List published opportunities",
)
async def list_opportunities(
    db: Annotated[AsyncSession, Depends(get_db)],
    opp_type: OpportunityType | None = None,
    include_expired: bool = False,
    offset: int = 0,
    limit: int = 20,
) -> PaginatedResponse[OpportunityResponse]:
    repo = OpportunityRepository(db)
    opps = await repo.list_filtered(
        opp_type=opp_type, active_only=not include_expired, offset=offset, limit=limit
    )
    total = await repo.count()
    return PaginatedResponse(
        items=[OpportunityResponse.model_validate(o) for o in opps],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/{opp_id}", response_model=OpportunityResponse)
async def get_opportunity(
    opp_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OpportunityResponse:
    opp = await OpportunityRepository(db).get_by_id_or_404(opp_id)
    return OpportunityResponse.model_validate(opp)


@router.post(
    "/",
    response_model=OpportunityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an opportunity (exec/admin only)",
)
async def create_opportunity(
    payload: OpportunityCreateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OpportunityResponse:
    assert_permission(can_post_opportunity(current_user))
    if payload.deadline < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deadline cannot be in the past.",
        )

    opp = await OpportunityRepository(db).create({
        **payload.model_dump(),
        "is_active": True,
        "is_published": current_user.role == UserRole.admin,
        "posted_by": current_user.id,
        "reviewed_by": current_user.id if current_user.role == UserRole.admin else None,
        "reviewed_at": datetime.now(UTC) if current_user.role == UserRole.admin else None,
    })
    await AuditService(db).log(
        action="CREATE", entity_type="opportunity",
        entity_id=opp.id, new_values={"title": opp.title}, request=request,
    )
    await db.commit()
    await db.refresh(opp)
    return OpportunityResponse.model_validate(opp)


@router.patch("/{opp_id}", response_model=OpportunityResponse)
async def update_opportunity(
    opp_id: uuid.UUID,
    payload: OpportunityUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OpportunityResponse:
    assert_permission(can_post_opportunity(current_user))
    repo = OpportunityRepository(db)
    opp = await repo.get_by_id_or_404(opp_id)
    updates = payload.model_dump(exclude_none=True)

    if "is_published" in updates and not can_publish_opportunity(current_user):
        raise HTTPException(status_code=403, detail="Only admins can publish opportunities.")

    old_values = {k: str(getattr(opp, k)) for k in updates}
    opp = await repo.update(opp, updates)
    await AuditService(db).log(
        action="UPDATE", entity_type="opportunity", entity_id=opp.id,
        old_values=old_values, new_values={k: str(v) for k, v in updates.items()},
        request=request,
    )
    await db.commit()
    await db.refresh(opp)
    return OpportunityResponse.model_validate(opp)


@router.delete(
    "/{opp_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def delete_opportunity(
    opp_id: uuid.UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    repo = OpportunityRepository(db)
    opp = await repo.get_by_id_or_404(opp_id)
    await repo.soft_delete(opp)
    await AuditService(db).log(
        action="DELETE", entity_type="opportunity", entity_id=opp.id, request=request
    )
    await db.commit()
    return MessageResponse(message="Opportunity removed.")
