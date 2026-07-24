"""
Academic resource service — file upload coordination.

Flow:
  1. Route receives UploadFile + JSON metadata
  2. Service validates file bytes (magic bytes + size)
  3. Uploads validated bytes to R2/S3 via StorageService
  4. Creates AcademicResource row with the returned object key
  5. Exec uploads go to is_published=False (pending admin review)
     Admin uploads go directly to is_published=True
"""

import uuid
from datetime import UTC, datetime

import structlog
from fastapi import HTTPException, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import assert_permission, can_publish_resource, can_upload_resource
from app.models.user import User
from app.repositories.academic_resource import AcademicResourceRepository, CourseRepository
from app.schemas.academic_resource import (
    AcademicResourceCreateRequest,
    AcademicResourceResponse,
    CourseCreateRequest,
    CourseResponse,
)
from app.services.audit import AuditService
from app.services.storage import storage
from app.utils.file_validation import FileValidationError, validate_academic_file

logger = structlog.get_logger(__name__)


class AcademicResourceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = AcademicResourceRepository(db)
        self.courses = CourseRepository(db)
        self.audit = AuditService(db)

    # ── Courses ───────────────────────────────────────────────────────────────

    async def create_course(
        self, payload: CourseCreateRequest, actor: User, request: Request
    ) -> CourseResponse:
        assert_permission(can_upload_resource(actor))
        course = await self.courses.create({
            "name": payload.name,
            "code": payload.code.upper() if payload.code else None,
            "level": payload.level,
        })
        await self.audit.log(
            action="CREATE", entity_type="course",
            entity_id=course.id, new_values={"name": course.name}, request=request,
        )
        await self.db.commit()
        return CourseResponse.model_validate(course)

    async def list_courses(self, level: int | None = None) -> list[CourseResponse]:
        if level:
            courses = await self.courses.list_by_level(level)
        else:
            courses = await self.courses.list()
        return [CourseResponse.model_validate(c) for c in courses]

    # ── Resources ─────────────────────────────────────────────────────────────

    async def upload_resource(
        self,
        file: UploadFile,
        payload: AcademicResourceCreateRequest,
        actor: User,
        request: Request,
    ) -> AcademicResourceResponse:
        assert_permission(can_upload_resource(actor))

        # Validate course exists
        await self.courses.get_by_id_or_404(payload.course_id)

        # Read and validate file
        content = await file.read()
        try:
            validated = validate_academic_file(content, file.filename or "upload")
        except FileValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            )

        # Upload to R2/S3
        key = await storage.upload(
            content=validated.content,
            folder="academic",
            filename=file.filename or "upload",
            mime_type=validated.mime_type,
            public=False,
        )

        is_published = can_publish_resource(actor)
        resource = await self.repo.create({
            "title": payload.title,
            "content_type": payload.content_type,
            "course_id": payload.course_id,
            "level": payload.level,
            "trimester": payload.trimester,
            "file_key": key,
            "file_type": validated.file_type,
            "mime_type": validated.mime_type,
            "file_size_bytes": validated.size_bytes,
            "duration_mins": payload.duration_mins,
            "is_featured": payload.is_featured,
            "is_published": is_published,
            "uploaded_by": actor.id,
            "reviewed_by": actor.id if is_published else None,
            "reviewed_at": datetime.now(UTC) if is_published else None,
        })

        await self.audit.log(
            action="CREATE", entity_type="academic_resource",
            entity_id=resource.id,
            new_values={"title": resource.title, "published": is_published},
            request=request,
        )
        await self.db.commit()

        return await self._to_response(resource)

    async def publish_resource(
        self, resource_id: uuid.UUID, actor: User, request: Request
    ) -> AcademicResourceResponse:
        assert_permission(can_publish_resource(actor))
        resource = await self.repo.get_by_id_or_404(resource_id)

        if resource.is_published:
            raise HTTPException(status_code=400, detail="Resource is already published.")

        resource = await self.repo.update(resource, {
            "is_published": True,
            "reviewed_by": actor.id,
            "reviewed_at": datetime.now(UTC),
        })
        await self.audit.log(
            action="PUBLISH", entity_type="academic_resource",
            entity_id=resource.id, request=request,
        )
        await self.db.commit()
        return await self._to_response(resource)

    async def get_download_url(self, resource_id: uuid.UUID) -> str:
        """Generate a presigned download URL valid for 1 hour."""
        resource = await self.repo.get_by_id_or_404(resource_id)
        if not resource.is_published:
            raise HTTPException(status_code=404, detail="Resource not found.")
        return await storage.presign(resource.file_key, expires_in=3600)

    async def delete_resource(
        self, resource_id: uuid.UUID, actor: User, request: Request
    ) -> None:
        resource = await self.repo.get_by_id_or_404(resource_id)
        await self.repo.soft_delete(resource)
        # Note: we keep the R2/S3 object for safety — a separate cleanup job
        # can purge objects whose keys are no longer referenced in the DB.
        await self.audit.log(
            action="DELETE", entity_type="academic_resource",
            entity_id=resource.id, request=request,
        )
        await self.db.commit()

    # ── Internal ──────────────────────────────────────────────────────────────

    async def _to_response(self, resource) -> AcademicResourceResponse:  # type: ignore[return]
        """Build response with eager-loaded course and presigned URL."""
        r = await self.repo.get_with_course(resource.id)
        if r is None:
            raise HTTPException(status_code=404, detail="Resource not found.")
        download_url = await storage.presign(r.file_key) if r.is_published else None
        resp = AcademicResourceResponse.model_validate(r)
        resp.download_url = download_url
        resp.thumbnail_url = storage.cdn_url(r.thumbnail_key) if r.thumbnail_key else None
        if r.course:
            resp.course = CourseResponse.model_validate(r.course)
        return resp
