"""
Opportunities — schemas and routes.
Business logic is delegated to OpportunityService.
"""

import uuid
from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from pydantic import Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.enums import OpportunityType, UserRole
from app.schemas.common import AppModel, MessageResponse, PaginatedResponse
from app.services.opportunity import OpportunityService

# ── Schemas ───────────────────────────────────────────────────────────────────

class OpportunityCreateRequest(AppModel):
    title: str = Field(min_length=3, max_length=500)
    organization: str = Field(min_length=2, max_length=255)
    opp_type: OpportunityType
    description: str = Field(min_length=10)
    location: str | None = Field(default=None, max_length=255)
    deadline: date
    external_link: str = Field(max_length=2048)

    @field_validator("external_link")
    @classmethod
    def validate_external_link(cls, value: str) -> str:
        if not value.startswith(("https://", "http://")):
            raise ValueError("external_link must be an http or https URL")
        return value


class OpportunityUpdateRequest(AppModel):
    title: str | None = Field(default=None, max_length=500)
    organization: str | None = Field(default=None, max_length=255)
    opp_type: OpportunityType | None = None
    description: str | None = None
    location: str | None = None
    deadline: date | None = None
    external_link: str | None = None
    is_published: bool | None = None

    @field_validator("external_link")
    @classmethod
    def validate_external_link(cls, value: str | None) -> str | None:
        if value is not None and not value.startswith(("https://", "http://")):
            raise ValueError("external_link must be an http or https URL")
        return value


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
    search: str | None = None,
    sort_by: str | None = None,
    sort_order: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> PaginatedResponse[OpportunityResponse]:
    svc = OpportunityService(db)
    opps, total = await svc.list_filtered(
        opp_type=opp_type,
        include_expired=include_expired,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        offset=offset,
        limit=limit,
    )
    return PaginatedResponse(
        items=[OpportunityResponse.model_validate(o) for o in opps],
        total=total,
        offset=offset,
        limit=limit,
    )

@router.get(
    "/admin/all",
    response_model=PaginatedResponse[OpportunityResponse],
    summary="List all opportunities including drafts and expired items",
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def list_all_opportunities(
    db: Annotated[AsyncSession, Depends(get_db)],
    offset: int = 0,
    limit: int = 100,
) -> PaginatedResponse[OpportunityResponse]:
    service = OpportunityService(db)
    opportunities = await service.repo.list(offset=offset, limit=limit)
    return PaginatedResponse(
        items=[OpportunityResponse.model_validate(item) for item in opportunities],
        total=await service.repo.count(),
        offset=offset,
        limit=limit,
    )


@router.get("/{opp_id}", response_model=OpportunityResponse)
async def get_opportunity(
    opp_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OpportunityResponse:
    opp = await OpportunityService(db).get_by_id(opp_id)
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
    opp = await OpportunityService(db).create(
        payload=payload.model_dump(),
        actor=current_user,
        request=request,
    )
    return OpportunityResponse.model_validate(opp)


@router.patch("/{opp_id}", response_model=OpportunityResponse)
async def update_opportunity(
    opp_id: uuid.UUID,
    payload: OpportunityUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OpportunityResponse:
    updates = payload.model_dump(exclude_none=True)
    opp = await OpportunityService(db).update(opp_id, updates, current_user, request)
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
    await OpportunityService(db).delete(opp_id, request)
    return MessageResponse(message="Opportunity removed.")
