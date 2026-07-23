import uuid
from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.enums import GalleryCategory, UserRole
from app.models.gallery import GalleryImage
from app.repositories.base import BaseRepository
from app.schemas.common import AppModel, MessageResponse
from app.services.audit import AuditService
from app.services.storage import storage
from app.utils.file_validation import validate_image_file


# ── Schemas ───────────────────────────────────────────────────────────────────

class GalleryImageResponse(AppModel):
    id: uuid.UUID
    image_url: str
    thumbnail_url: str | None
    title: str
    description: str | None
    category: GalleryCategory
    event_date: date | None
    sort_order: int
    is_published: bool
    created_at: datetime


class GalleryImageUpdateRequest(AppModel):
    title: str | None = None
    description: str | None = None
    category: GalleryCategory | None = None
    event_date: date | None = None
    sort_order: int | None = None
    is_published: bool | None = None


# ── Routes ────────────────────────────────────────────────────────────────────

router = APIRouter(tags=["Gallery"])


@router.get(
    "/",
    response_model=list[GalleryImageResponse],
    summary="List gallery images, optionally filtered by category",
)
async def list_gallery(
    db: Annotated[AsyncSession, Depends(get_db)],
    category: GalleryCategory | None = None,
    offset: int = 0,
    limit: int = 50,
) -> list[GalleryImageResponse]:
    q = select(GalleryImage).where(
        GalleryImage.deleted_at.is_(None),
        GalleryImage.is_published.is_(True),
    )
    if category:
        q = q.where(GalleryImage.category == category)
    q = q.order_by(GalleryImage.sort_order.asc(), GalleryImage.created_at.desc())
    q = q.offset(offset).limit(limit)
    result = await db.execute(q)
    images = list(result.scalars().all())
    return [GalleryImageResponse.model_validate(img) for img in images]

@router.get(
    "/admin/all",
    response_model=list[GalleryImageResponse],
    summary="List all gallery images including drafts",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def list_admin_gallery(
    db: Annotated[AsyncSession, Depends(get_db)],
    offset: int = 0,
    limit: int = 200,
) -> list[GalleryImageResponse]:
    result = await db.execute(
        select(GalleryImage)
        .where(GalleryImage.deleted_at.is_(None))
        .order_by(GalleryImage.sort_order.asc(), GalleryImage.created_at.desc())
        .offset(offset)
        .limit(min(limit, 500))
    )
    return [GalleryImageResponse.model_validate(img) for img in result.scalars().all()]


@router.post(
    "/",
    response_model=GalleryImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a gallery image (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def create_gallery_image(
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WebP)"),
    title: str = Form(...),
    description: str | None = Form(default=None),
    category: GalleryCategory = Form(...),
    event_date: date | None = Form(default=None),
    sort_order: int = Form(default=0),
    is_published: bool = Form(default=True),
) -> GalleryImageResponse:
    content = await file.read()
    validated = validate_image_file(content, file.filename or "image.jpg")

    image_key = await storage.upload(
        content=validated.content,
        folder="gallery",
        filename=file.filename or "image.jpg",
        mime_type=validated.mime_type,
        public=True,
    )
    image_url = storage.cdn_url(image_key)

    repo = BaseRepository(GalleryImage, db)
    img = await repo.create({
        "image_url": image_url,
        "image_key": image_key,
        "title": title,
        "description": description,
        "category": category.value,
        "event_date": event_date,
        "sort_order": sort_order,
        "is_published": is_published,
    })
    await AuditService(db).log(
        action="CREATE", entity_type="gallery_image", entity_id=img.id,
        new_values={"title": img.title, "category": img.category}, request=request,
    )
    await db.commit()
    return GalleryImageResponse.model_validate(img)


@router.get(
    "/{image_id}",
    response_model=GalleryImageResponse,
    summary="Get a gallery image by ID",
)
async def get_gallery_image(
    image_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GalleryImageResponse:
    repo = BaseRepository(GalleryImage, db)
    img = await repo.get_by_id_or_404(image_id)
    if not img.is_published:
        raise HTTPException(status_code=404, detail="Gallery image not found.")
    return GalleryImageResponse.model_validate(img)


@router.patch(
    "/{image_id}",
    response_model=GalleryImageResponse,
    summary="Update gallery image metadata (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def update_gallery_image(
    image_id: uuid.UUID,
    payload: GalleryImageUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GalleryImageResponse:
    repo = BaseRepository(GalleryImage, db)
    img = await repo.get_by_id_or_404(image_id)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    old_values = {k: str(getattr(img, k)) for k in updates}
    img = await repo.update(img, updates)
    await AuditService(db).log(
        action="UPDATE", entity_type="gallery_image", entity_id=img.id,
        old_values=old_values, new_values={k: str(v) for k, v in updates.items()},
        request=request,
    )
    await db.commit()
    return GalleryImageResponse.model_validate(img)


@router.post(
    "/{image_id}/image",
    response_model=GalleryImageResponse,
    summary="Replace a gallery image file (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def replace_gallery_image(
    image_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
) -> GalleryImageResponse:
    repo = BaseRepository(GalleryImage, db)
    img = await repo.get_by_id_or_404(image_id)
    content = await file.read()
    validated = validate_image_file(content, file.filename or "image.jpg")
    new_key = await storage.upload(
        content=validated.content,
        folder="gallery",
        filename=file.filename or "image.jpg",
        mime_type=validated.mime_type,
        public=True,
    )
    old_key = img.image_key
    img = await repo.update(img, {
        "image_key": new_key,
        "image_url": storage.cdn_url(new_key),
        "thumbnail_url": None,
    })
    await AuditService(db).log(
        action="REPLACE_IMAGE", entity_type="gallery_image", entity_id=img.id,
        new_values={"image_key": new_key}, request=request,
    )
    await db.commit()
    if old_key:
        try:
            await storage.delete(old_key)
        except Exception:
            # The database already points at the new object. A storage cleanup
            # failure must not turn a successful replacement into a 500.
            pass
    return GalleryImageResponse.model_validate(img)


@router.delete(
    "/{image_id}",
    response_model=MessageResponse,
    summary="Delete a gallery image (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def delete_gallery_image(
    image_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    repo = BaseRepository(GalleryImage, db)
    img = await repo.get_by_id_or_404(image_id)
    await repo.soft_delete(img)
    await AuditService(db).log(
        action="DELETE", entity_type="gallery_image", entity_id=img.id, request=request,
    )
    await db.commit()
    if img.image_key:
        try:
            await storage.delete(img.image_key)
        except Exception:
            pass
    return MessageResponse(message="Gallery image deleted.")
