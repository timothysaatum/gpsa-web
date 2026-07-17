import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.core.permissions import assert_permission, can_upload_resource
from app.db.session import get_db
from app.models.enums import ContentType, Trimester, UserRole
from app.repositories.academic_resource import AcademicResourceRepository
from app.schemas.academic_resource import (
    AcademicResourceCreateRequest,
    AcademicResourceResponse,
    AcademicResourceUpdateRequest,
    CourseCreateRequest,
    CourseResponse,
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.academic_resource import AcademicResourceService
from app.services.audit import AuditService
from app.services.storage import storage

router = APIRouter(tags=["Academic Resources"])


# ── Courses ───────────────────────────────────────────────────────────────────

@router.get("/courses", response_model=list[CourseResponse], summary="List all courses")
async def list_courses(
    db: Annotated[AsyncSession, Depends(get_db)],
    level: int | None = None,
) -> list[CourseResponse]:
    return await AcademicResourceService(db).list_courses(level=level)


@router.post(
    "/courses",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a course (exec/admin only)",
)
async def create_course(
    payload: CourseCreateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CourseResponse:
    return await AcademicResourceService(db).create_course(payload, current_user, request)


# ── Resources ─────────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=PaginatedResponse[AcademicResourceResponse],
    summary="List published academic resources with filters",
)
async def list_resources(
    db: Annotated[AsyncSession, Depends(get_db)],
    level: int | None = None,
    trimester: Trimester | None = None,
    content_type: ContentType | None = None,
    course_id: uuid.UUID | None = None,
    search: str | None = None,
    is_featured: bool | None = None,
    sort_by: str | None = None,
    sort_order: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> PaginatedResponse[AcademicResourceResponse]:
    repo = AcademicResourceRepository(db)
    resources = await repo.list_filtered(
        level=level,
        trimester=trimester,
        content_type=content_type,
        course_id=course_id,
        search=search,
        is_featured=is_featured,
        sort_by=sort_by,
        sort_order=sort_order,
        offset=offset,
        limit=limit,
    )
    total = await repo.count_filtered(
        level=level,
        trimester=trimester,
        content_type=content_type,
        course_id=course_id,
        search=search,
        is_featured=is_featured,
    )
    items = []
    for r in resources:
        url = await storage.presign(r.file_key)
        resp = AcademicResourceResponse.model_validate(r)
        resp.download_url = url
        items.append(resp)
    return PaginatedResponse(items=items, total=total, offset=offset, limit=limit)


@router.get(
    "/{resource_id}",
    response_model=AcademicResourceResponse,
    summary="Get a resource with a presigned download URL",
)
async def get_resource(
    resource_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AcademicResourceResponse:
    svc = AcademicResourceService(db)
    resource = await AcademicResourceRepository(db).get_by_id_or_404(resource_id)
    if not resource.is_published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found.")
    return await svc._to_response(resource)


@router.post(
    "/",
    response_model=AcademicResourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a new academic resource file (exec/admin only)",
)
async def upload_resource(
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(..., description="The resource file (PDF, DOCX, MP4, etc.)"),
    # Metadata passed as Form fields alongside the file
    title: str = Form(...),
    content_type: ContentType = Form(...),
    course_id: uuid.UUID = Form(...),
    level: int = Form(...),
    trimester: Trimester = Form(...),
    duration_mins: int | None = Form(default=None),
    is_featured: bool = Form(default=False),
) -> AcademicResourceResponse:
    payload = AcademicResourceCreateRequest(
        title=title,
        content_type=content_type,
        course_id=course_id,
        level=level,
        trimester=trimester,
        duration_mins=duration_mins,
        is_featured=is_featured,
    )
    return await AcademicResourceService(db).upload_resource(file, payload, current_user, request)


@router.patch(
    "/{resource_id}",
    response_model=AcademicResourceResponse,
    summary="Update resource metadata (exec/admin only)",
)
async def update_resource(
    resource_id: uuid.UUID,
    payload: AcademicResourceUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AcademicResourceResponse:
    assert_permission(can_upload_resource(current_user))
    repo = AcademicResourceRepository(db)
    resource = await repo.get_by_id_or_404(resource_id)
    updates = payload.model_dump(exclude_none=True)
    old_values = {k: str(getattr(resource, k)) for k in updates}
    resource = await repo.update(resource, updates)
    await AuditService(db).log(
        action="UPDATE", entity_type="academic_resource",
        entity_id=resource.id, old_values=old_values,
        new_values={k: str(v) for k, v in updates.items()}, request=request,
    )
    await db.commit()
    return await AcademicResourceService(db)._to_response(resource)


@router.post(
    "/{resource_id}/publish",
    response_model=AcademicResourceResponse,
    summary="Publish a pending resource (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def publish_resource(
    resource_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AcademicResourceResponse:
    return await AcademicResourceService(db).publish_resource(resource_id, current_user, request)


@router.delete(
    "/{resource_id}",
    response_model=MessageResponse,
    summary="Soft-delete a resource (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def delete_resource(
    resource_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    await AcademicResourceService(db).delete_resource(resource_id, current_user, request)
    return MessageResponse(message="Resource deleted.")
