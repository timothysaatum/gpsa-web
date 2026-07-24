import uuid
from contextlib import suppress
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.enums import NewsCategory, UserRole
from app.schemas.common import AppModel, MessageResponse, PaginatedResponse
from app.services.news import NewsService
from app.services.storage import storage
from app.utils.file_validation import FileValidationError, validate_image_file

# ── Schemas ───────────────────────────────────────────────────────────────────

class NewsCreateRequest(AppModel):
    title: str = Field(min_length=3, max_length=500)
    category: NewsCategory
    summary: str = Field(min_length=10)
    body: str = Field(min_length=20)
    banner_emoji: str | None = Field(default=None, max_length=10)
    image_alt: str | None = Field(default=None, max_length=500)
    is_featured: bool = False
    is_urgent: bool = False
    is_strip_announcement: bool = False
    attachments: list[str] | None = None
    publish_immediately: bool = False


class NewsUpdateRequest(AppModel):
    title: str | None = Field(default=None, max_length=500)
    category: NewsCategory | None = None
    summary: str | None = None
    body: str | None = None
    banner_emoji: str | None = None
    image_alt: str | None = Field(default=None, max_length=500)
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
    image_url: str | None = None
    image_alt: str | None
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
    image_url: str | None = None
    image_alt: str | None
    is_featured: bool
    is_urgent: bool
    published_at: datetime | None


# ── Routes ────────────────────────────────────────────────────────────────────

router = APIRouter(tags=["News"])


def news_response(post: object) -> NewsResponse:
    response = NewsResponse.model_validate(post)
    key = getattr(post, "image_key", None)
    return response.model_copy(update={"image_url": storage.cdn_url(key) if key else None})


def news_summary_response(post: object) -> NewsSummaryResponse:
    response = NewsSummaryResponse.model_validate(post)
    key = getattr(post, "image_key", None)
    return response.model_copy(update={"image_url": storage.cdn_url(key) if key else None})


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
    svc = NewsService(db)
    posts, total = await svc.list_published(category=category, offset=offset, limit=limit)
    return PaginatedResponse(
        items=[news_summary_response(p) for p in posts],
        total=total,
        offset=offset,
        limit=limit,
    )

@router.get(
    "/admin/all",
    response_model=PaginatedResponse[NewsSummaryResponse],
    summary="List all news posts including drafts",
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def list_all_news(
    db: Annotated[AsyncSession, Depends(get_db)],
    offset: int = 0,
    limit: int = 100,
) -> PaginatedResponse[NewsSummaryResponse]:
    service = NewsService(db)
    posts = await service.repo.list(offset=offset, limit=limit)
    return PaginatedResponse(
        items=[news_summary_response(post) for post in posts],
        total=await service.repo.count(),
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
    post = await NewsService(db).get_featured()
    return news_response(post) if post else None


@router.get(
    "/strip",
    response_model=list[NewsSummaryResponse],
    summary="Get announcements for the marquee strip",
)
async def get_strip_announcements(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[NewsSummaryResponse]:
    posts = await NewsService(db).get_strip_announcements()
    return [news_summary_response(p) for p in posts]


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
    posts = await NewsService(db).search(q, offset=offset, limit=limit)
    return [news_summary_response(p) for p in posts]


@router.get("/{post_id}", response_model=NewsResponse, summary="Get a news post")
async def get_news_post(
    post_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NewsResponse:
    post = await NewsService(db).get_by_id(post_id)
    return news_response(post)


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
    post = await NewsService(db).create(
        title=payload.title,
        category=payload.category,
        summary=payload.summary,
        body=payload.body,
        actor=current_user,
        request=request,
        banner_emoji=payload.banner_emoji,
        image_alt=payload.image_alt,
        is_featured=payload.is_featured,
        is_urgent=payload.is_urgent,
        is_strip_announcement=payload.is_strip_announcement,
        attachments=payload.attachments,
        publish_immediately=payload.publish_immediately,
    )
    return news_response(post)


@router.patch("/{post_id}", response_model=NewsResponse, summary="Update a news post")
async def update_news_post(
    post_id: uuid.UUID,
    payload: NewsUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NewsResponse:
    updates = payload.model_dump(exclude_none=True)
    post = await NewsService(db).update(post_id, updates, current_user, request)
    return news_response(post)


@router.post(
    "/{post_id}/image",
    response_model=NewsResponse,
    summary="Upload or replace a news cover image",
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def upload_news_image(
    post_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(..., description="Cover image (JPEG, PNG, WebP or GIF; max 10 MB)"),
) -> NewsResponse:
    service = NewsService(db)
    post = await service.repo.get_by_id_or_404(post_id)
    content = await file.read()
    try:
        validated = validate_image_file(content, file.filename or "news-cover.jpg")
    except FileValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    new_key = await storage.upload(
        validated.content,
        "news",
        file.filename or "news-cover.jpg",
        validated.mime_type,
        public=True,
    )
    old_key = post.image_key
    try:
        post = await service.repo.update(
            post,
            {
                "image_key": new_key,
                # Existing posts predate image support. Use their headline as
                # meaningful fallback text until an editor supplies a custom
                # description through the news update API.
                "image_alt": post.image_alt or post.title,
            },
        )
        await service.audit.log(
            action="UPLOAD_IMAGE" if old_key is None else "REPLACE_IMAGE",
            entity_type="news_post",
            entity_id=post.id,
            new_values={"image_key": new_key},
            request=request,
        )
        await db.commit()
    except Exception:
        with suppress(Exception):
            await storage.delete(new_key)
        raise
    if old_key:
        with suppress(Exception):
            await storage.delete(old_key)
    await db.refresh(post)
    return news_response(post)


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
    post = await NewsService(db).publish(post_id, request)
    return news_response(post)


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
    service = NewsService(db)
    post = await service.repo.get_by_id_or_404(post_id)
    image_key = post.image_key
    await service.delete(post_id, request)
    if image_key:
        with suppress(Exception):
            await storage.delete(image_key)
    return MessageResponse(message="Post deleted.")
