import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.hero_slide import HeroSlide
from app.repositories.base import BaseRepository
from app.schemas.common import AppModel, MessageResponse
from app.services.audit import AuditService


# ── Schemas ───────────────────────────────────────────────────────────────────

class HeroSlideCreateRequest(AppModel):
    image_url: str = Field(min_length=1, max_length=1000)
    tag: str = Field(min_length=1, max_length=100)
    heading: str = Field(min_length=1, max_length=200)
    highlight: str = Field(min_length=1, max_length=200)
    sub: str = Field(min_length=1)
    primary_button_label: str = Field(min_length=1, max_length=100)
    primary_button_path: str = Field(min_length=1, max_length=500)
    secondary_button_label: str = Field(min_length=1, max_length=100)
    secondary_button_path: str = Field(min_length=1, max_length=500)
    sort_order: int = 0
    is_active: bool = True


class HeroSlideUpdateRequest(AppModel):
    image_url: str | None = Field(default=None, max_length=1000)
    tag: str | None = Field(default=None, max_length=100)
    heading: str | None = Field(default=None, max_length=200)
    highlight: str | None = Field(default=None, max_length=200)
    sub: str | None = None
    primary_button_label: str | None = Field(default=None, max_length=100)
    primary_button_path: str | None = Field(default=None, max_length=500)
    secondary_button_label: str | None = Field(default=None, max_length=100)
    secondary_button_path: str | None = Field(default=None, max_length=500)
    sort_order: int | None = None
    is_active: bool | None = None


class HeroSlideResponse(AppModel):
    id: uuid.UUID
    image_url: str
    tag: str
    heading: str
    highlight: str
    sub: str
    primary_button_label: str
    primary_button_path: str
    secondary_button_label: str
    secondary_button_path: str
    sort_order: int
    is_active: bool
    created_at: datetime


# ── Routes ────────────────────────────────────────────────────────────────────

router = APIRouter(tags=["Hero"])


@router.get(
    "/",
    response_model=list[HeroSlideResponse],
    summary="List active hero slides sorted by order",
)
async def list_hero_slides(
    db: Annotated[AsyncSession, Depends(get_db)],
    include_inactive: bool = False,
) -> list[HeroSlideResponse]:
    q = select(HeroSlide).where(HeroSlide.deleted_at.is_(None))
    if not include_inactive:
        q = q.where(HeroSlide.is_active.is_(True))
    q = q.order_by(HeroSlide.sort_order.asc(), HeroSlide.created_at.desc())
    result = await db.execute(q)
    slides = list(result.scalars().all())
    return [HeroSlideResponse.model_validate(s) for s in slides]


@router.post(
    "/",
    response_model=HeroSlideResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a hero slide (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def create_hero_slide(
    payload: HeroSlideCreateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HeroSlideResponse:
    repo = BaseRepository(HeroSlide, db)
    slide = await repo.create(payload.model_dump())
    await AuditService(db).log(
        action="CREATE", entity_type="hero_slide", entity_id=slide.id,
        new_values={"tag": slide.tag}, request=request,
    )
    await db.commit()
    return HeroSlideResponse.model_validate(slide)


@router.get(
    "/{slide_id}",
    response_model=HeroSlideResponse,
    summary="Get a hero slide by ID",
)
async def get_hero_slide(
    slide_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HeroSlideResponse:
    repo = BaseRepository(HeroSlide, db)
    slide = await repo.get_by_id_or_404(slide_id)
    return HeroSlideResponse.model_validate(slide)


@router.patch(
    "/{slide_id}",
    response_model=HeroSlideResponse,
    summary="Update a hero slide (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def update_hero_slide(
    slide_id: uuid.UUID,
    payload: HeroSlideUpdateRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HeroSlideResponse:
    repo = BaseRepository(HeroSlide, db)
    slide = await repo.get_by_id_or_404(slide_id)
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    old_values = {k: str(getattr(slide, k)) for k in updates}
    slide = await repo.update(slide, updates)
    await AuditService(db).log(
        action="UPDATE", entity_type="hero_slide", entity_id=slide.id,
        old_values=old_values, new_values={k: str(v) for k, v in updates.items()},
        request=request,
    )
    await db.commit()
    return HeroSlideResponse.model_validate(slide)


@router.delete(
    "/{slide_id}",
    response_model=MessageResponse,
    summary="Delete a hero slide (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def delete_hero_slide(
    slide_id: uuid.UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    repo = BaseRepository(HeroSlide, db)
    slide = await repo.get_by_id_or_404(slide_id)
    await repo.soft_delete(slide)
    await AuditService(db).log(
        action="DELETE", entity_type="hero_slide", entity_id=slide.id, request=request,
    )
    await db.commit()
    return MessageResponse(message="Hero slide deleted.")
