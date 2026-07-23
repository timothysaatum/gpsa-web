from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.cms import CmsPage
from app.models.enums import UserRole
from app.schemas.common import AppModel, MessageResponse
from app.services.audit import AuditService

router = APIRouter(prefix="/cms/pages", tags=["CMS Pages"])


class CmsPageResponse(AppModel):
    slug: str
    title: str
    content: dict[str, Any]
    is_published: bool
    version: int


class CmsPageUpdate(AppModel):
    title: str = Field(min_length=2, max_length=200)
    content: dict[str, Any]
    is_published: bool = False
    expected_version: int | None = None


async def get_published_page(db: AsyncSession, slug: str) -> CmsPage | None:
    result = await db.execute(
        select(CmsPage).where(
            CmsPage.slug == slug,
            CmsPage.deleted_at.is_(None),
            CmsPage.is_published.is_(True),
        )
    )
    return result.scalar_one_or_none()


@router.get("/public/{slug}", response_model=dict[str, Any])
async def get_public_page(slug: str, db: Annotated[AsyncSession, Depends(get_db)]) -> dict[str, Any]:
    page = await get_published_page(db, slug)
    if page is None:
        raise HTTPException(status_code=404, detail="Published page content not found.")
    return page.content


@router.get("/{slug}", response_model=CmsPageResponse, dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))])
async def get_page(slug: str, db: Annotated[AsyncSession, Depends(get_db)]) -> CmsPageResponse:
    result = await db.execute(select(CmsPage).where(CmsPage.slug == slug, CmsPage.deleted_at.is_(None)))
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=404, detail="CMS page not found.")
    return CmsPageResponse.model_validate(page)


@router.put("/{slug}", response_model=CmsPageResponse, dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))])
async def upsert_page(
    slug: str,
    payload: CmsPageUpdate,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CmsPageResponse:
    if slug == "impact":
        if payload.is_published and current_user.role != UserRole.admin:
            raise HTTPException(status_code=403, detail="Only administrators can publish the Impact page.")
        if payload.is_published and payload.content.get("hero_image_url") and not payload.content.get("hero_image_alt"):
            raise HTTPException(status_code=422, detail="Published hero images require alternative text.")
    result = await db.execute(select(CmsPage).where(CmsPage.slug == slug))
    page = result.scalar_one_or_none()
    if page is None:
        page = CmsPage(slug=slug, title=payload.title, content=payload.content, is_published=payload.is_published)
        db.add(page)
        action = "CREATE"
    else:
        was_deleted = page.deleted_at is not None
        if payload.expected_version is not None and payload.expected_version != page.version:
            raise HTTPException(status_code=409, detail="This page was changed by another editor. Reload before saving.")
        page.title = payload.title
        page.content = payload.content
        page.is_published = payload.is_published
        page.deleted_at = None
        page.version += 1
        action = "RESTORE" if was_deleted else "UPDATE"
    await db.flush()
    await AuditService(db).log(
        action=action,
        entity_type="cms_page",
        entity_id=page.id,
        new_values={"slug": slug, "is_published": page.is_published, "version": page.version},
        request=request,
    )
    await db.commit()
    await db.refresh(page)
    return CmsPageResponse.model_validate(page)


@router.delete(
    "/{slug}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def delete_page(
    slug: str,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    result = await db.execute(
        select(CmsPage).where(CmsPage.slug == slug, CmsPage.deleted_at.is_(None))
    )
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=404, detail="CMS page not found.")
    from datetime import UTC, datetime

    page.deleted_at = datetime.now(UTC)
    page.is_published = False
    page.version += 1
    await AuditService(db).log(
        action="DELETE",
        entity_type="cms_page",
        entity_id=page.id,
        new_values={"slug": slug, "version": page.version},
        request=request,
    )
    await db.commit()
    return MessageResponse(message="CMS page deleted.")
