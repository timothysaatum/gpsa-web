import uuid
from datetime import UTC, datetime
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.core.permissions import assert_permission, can_publish_news, can_write_news
from app.db.session import get_db
from app.models.enums import NewsCategory, UserRole
from app.models.news import NewsPost
from app.repositories.base import BaseRepository
from app.schemas.common import AppModel, MessageResponse, PaginatedResponse
from app.services.audit import AuditService

logger = structlog.get_logger(__name__)


# ── Schemas ───────────────────────────────────────────────────────────────────

class NewsCreateRequest(AppModel):
    title: str = Field(min_length=3, max_length=500)
    category: NewsCategory
    summary: str = Field(min_length=10)
    body: str = Field(min_length=20)
    banner_emoji: str | None = Field(default=None, max_length=10)
    is_featured: bool = False
    is_urgent: bool = False
    is_strip_announcement: bool = False
    attachments: list[str] | None = None
    publish_immediately: bool = False  # admins can publish on create


class NewsUpdateRequest(AppModel):
    title: str | None = Field(default=None, max_length=500)
    category: NewsCategory | None = None
    summary: str | None = None
    body: str | None = None
    banner_emoji: str | None = None
    is_featured: bool | None = None
    is_urgent: bool | None = None
    is_strip_announcement: bool | None = None
    attachments: list[str] | None = None


class NewsResponse(AppModel):
    id: uuid.UUID
    title: str
    category: NewsCategory
    summary: str
    body: str
    banner_emoji: str | None
    is_featured: bool
    is_urgent: bool
    is_strip_announcement: bool
    is_published: bool
    published_at: datetime | None
    attachments: list | None
    created_at: datetime


class NewsSummaryResponse(AppModel):
    id: uuid.UUID
    title: str
    category: NewsCategory
    summary: str
    banner_emoji: str | None
    is_featured: bool
    is_urgent: bool
    published_at: datetime | None


# ── Repository ────────────────────────────────────────────────────────────────

class NewsRepository(BaseRepository[NewsPost]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(NewsPost, db)

    async def list_published(
        self,
        *,
        category: NewsCategory | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[NewsPost]:
        q = (
            self._base_query()
            .where(NewsPost.published_at.is_not(None))
        )
        if category:
            q = q.where(NewsPost.category == category)
        q = q.order_by(NewsPost.published_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get_featured(self) -> NewsPost | None:
        result = await self.db.execute(
            self._base_query()
            .where(NewsPost.is_featured.is_(True), NewsPost.published_at.is_not(None))
            .order_by(NewsPost.published_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_strip_announcements(self) -> list[NewsPost]:
        result = await self.db.execute(
            self._base_query()
            .where(
                NewsPost.is_strip_announcement.is_(True),
                NewsPost.published_at.is_not(None),
            )
            .order_by(NewsPost.published_at.desc())
            .limit(10)
        )
        return list(result.scalars().all())

    async def search(self, q_str: str, offset: int = 0, limit: int = 20) -> list[NewsPost]:
        from sqlalchemy import or_
        result = await self.db.execute(
            self._base_query()
            .where(
                NewsPost.published_at.is_not(None),
                or_(
                    NewsPost.title.ilike(f"%{q_str}%"),
                    NewsPost.summary.ilike(f"%{q_str}%"),
                    NewsPost.body.ilike(f"%{q_str}%"),
                ),
            )
            .order_by(NewsPost.published_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())


# ── Routes ────────────────────────────────────────────────────────────────────

router = APIRouter(tags=["News"])


@router.get(
    "/",
    response_model=PaginatedResponse[NewsSummaryResponse],
    summary="List published news posts",
)
async def list_news(
    db: Annotated[AsyncSession, Depends(get_db)],
    category: NewsCategory | None = None,
    offset: int = 0,
    limit: int = 20,
) -> PaginatedResponse[NewsSummaryResponse]:
    repo = NewsRepository(db)
    posts = await repo.list_published(category=category, offset=offset, limit=limit)
    total = await repo.count()
    return PaginatedResponse(
        items=[NewsSummaryResponse.model_validate(p) for p in posts],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get(
    "/featured",
    response_model=NewsResponse | None,
    summary="Get the featured news post",
)
async def get_featured_news(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NewsResponse | None:
    post = await NewsRepository(db).get_featured()
    return NewsResponse.model_validate(post) if post else None


@router.get(
    "/strip",
    response_model=list[NewsSummaryResponse],
    summary="Get announcements for the marquee strip",
)
async def get_strip_announcements(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[NewsSummaryResponse]:
    posts = await NewsRepository(db).get_strip_announcements()
    return [NewsSummaryResponse.model_validate(p) for p in posts]


@router.get(
    "/search",
    response_model=list[NewsSummaryResponse],
    summary="Full-text search across news posts",
)
async def search_news(
    q: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    offset: int = 0,
    limit: int = 20,
) -> list[NewsSummaryResponse]:
    if len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters.")
    posts = await NewsRepository(db).search(q.strip(), offset=offset, limit=limit)
    return [NewsSummaryResponse.model_validate(p) for p in posts]


@router.get("/{post_id}", response_model=NewsResponse, summary="Get a news post")
async def get_news_post(
    post_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NewsResponse:
    post = await NewsRepository(db).get_by_id_or_404(post_id)
    if not post.is_published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
    return NewsResponse.model_validate(post)


@router.post(
    "/",
    response_model=NewsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a news post (exec/admin only)",
)
async def create_news_post(
    payload: NewsCreateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NewsResponse:
    assert_permission(can_write_news(current_user))
    can_publish = can_publish_news(current_user)

    if payload.publish_immediately and not can_publish:
        raise HTTPException(status_code=403, detail="Only admins can publish immediately.")

    published_at = datetime.now(UTC) if (payload.publish_immediately and can_publish) else None

    post = await NewsRepository(db).create({
        "title": payload.title,
        "category": payload.category,
        "summary": payload.summary,
        "body": payload.body,
        "banner_emoji": payload.banner_emoji,
        "is_featured": payload.is_featured,
        "is_urgent": payload.is_urgent,
        "is_strip_announcement": payload.is_strip_announcement,
        "attachments": payload.attachments,
        "published_at": published_at,
        "author_id": current_user.id,
    })
    await AuditService(db).log(
        action="CREATE", entity_type="news_post", entity_id=post.id,
        new_values={"title": post.title, "published": post.is_published}, request=request,
    )
    await db.commit()
    await db.refresh(post)
    return NewsResponse.model_validate(post)


@router.patch("/{post_id}", response_model=NewsResponse, summary="Update a news post")
async def update_news_post(
    post_id: uuid.UUID,
    payload: NewsUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NewsResponse:
    assert_permission(can_write_news(current_user))
    repo = NewsRepository(db)
    post = await repo.get_by_id_or_404(post_id)
    updates = payload.model_dump(exclude_none=True)
    old_values = {k: str(getattr(post, k)) for k in updates}
    post = await repo.update(post, updates)
    await AuditService(db).log(
        action="UPDATE", entity_type="news_post", entity_id=post.id,
        old_values=old_values, new_values={k: str(v) for k, v in updates.items()},
        request=request,
    )
    await db.commit()
    await db.refresh(post)
    return NewsResponse.model_validate(post)


@router.post(
    "/{post_id}/publish",
    response_model=NewsResponse,
    summary="Publish a draft post (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def publish_news_post(
    post_id: uuid.UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NewsResponse:
    repo = NewsRepository(db)
    post = await repo.get_by_id_or_404(post_id)
    if post.is_published:
        raise HTTPException(status_code=400, detail="Post is already published.")
    post = await repo.update(post, {"published_at": datetime.now(UTC)})
    await AuditService(db).log(
        action="PUBLISH", entity_type="news_post", entity_id=post.id, request=request
    )
    await db.commit()
    await db.refresh(post)
    return NewsResponse.model_validate(post)


@router.delete(
    "/{post_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def delete_news_post(
    post_id: uuid.UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    repo = NewsRepository(db)
    post = await repo.get_by_id_or_404(post_id)
    await repo.soft_delete(post)
    await AuditService(db).log(
        action="DELETE", entity_type="news_post", entity_id=post.id, request=request
    )
    await db.commit()
    return MessageResponse(message="Post deleted.")
