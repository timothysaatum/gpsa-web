import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import require_roles
from app.db.session import get_db
from app.models.academic_resource import AcademicResource
from app.models.audit import AuditLog
from app.models.enums import ReportStatus, UserRole
from app.models.event import Event
from app.models.gallery import GalleryImage
from app.models.news import NewsPost
from app.models.opportunity import Opportunity
from app.models.user import User
from app.models.welfare import WelfareReport
from app.schemas.common import AppModel, PaginatedResponse
from app.services.audit import AuditService

router = APIRouter(tags=["Admin"])


class AdminDashboardResponse(AppModel):
    users: int
    news_posts: int
    events: int
    opportunities: int
    gallery_images: int
    academic_resources: int
    welfare_reports: int
    pending_welfare_reports: int
    recent_audit: list["AuditLogResponse"]


class AuditActorResponse(AppModel):
    id: uuid.UUID
    full_name: str
    email: str
    role: UserRole


class AuditLogResponse(AppModel):
    id: uuid.UUID
    actor_id: uuid.UUID | None
    actor: AuditActorResponse | None = None
    action: str
    entity_type: str
    entity_id: uuid.UUID | None
    old_values: dict | None
    new_values: dict | None
    ip_address: str | None
    user_agent: str | None
    request_id: str | None
    created_at: datetime


async def _count(db: AsyncSession, model, *criteria) -> int:
    result = await db.execute(select(func.count()).select_from(model).where(*criteria))
    return result.scalar_one()


@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse,
    summary="Admin dashboard summary",
)
async def dashboard(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.exec))],
) -> AdminDashboardResponse:
    # Audit details are admin-only. Executives may use the content dashboard, but
    # must not receive audit snapshots through this otherwise shared endpoint.
    recent_logs: list[AuditLog] = []
    if user.role == UserRole.admin:
        recent = await db.execute(
            select(AuditLog)
            .options(selectinload(AuditLog.actor))
            .order_by(AuditLog.created_at.desc())
            .limit(8)
        )
        recent_logs = list(recent.scalars().all())

    return AdminDashboardResponse(
        users=await _count(db, User, User.deleted_at.is_(None)),
        news_posts=await _count(db, NewsPost, NewsPost.deleted_at.is_(None)),
        events=await _count(db, Event, Event.deleted_at.is_(None)),
        opportunities=await _count(db, Opportunity, Opportunity.deleted_at.is_(None)),
        gallery_images=await _count(db, GalleryImage, GalleryImage.deleted_at.is_(None)),
        academic_resources=await _count(
            db, AcademicResource, AcademicResource.deleted_at.is_(None)
        ),
        welfare_reports=await _count(db, WelfareReport, WelfareReport.deleted_at.is_(None)),
        pending_welfare_reports=await _count(
            db,
            WelfareReport,
            WelfareReport.deleted_at.is_(None),
            WelfareReport.status == ReportStatus.pending,
        ),
        recent_audit=[AuditLogResponse.model_validate(log) for log in recent_logs],
    )


@router.get(
    "/audit-logs",
    response_model=PaginatedResponse[AuditLogResponse],
    summary="List audit logs",
)
async def audit_logs(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.admin))],
    actor_id: uuid.UUID | None = None,
    action: str | None = Query(default=None, max_length=50),
    entity_type: str | None = Query(default=None, max_length=100),
    role: UserRole | None = None,
    search: str | None = Query(default=None, max_length=100),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> PaginatedResponse[AuditLogResponse]:
    filters = []
    if actor_id:
        filters.append(AuditLog.actor_id == actor_id)
    if action:
        filters.append(AuditLog.action.ilike(f"%{action}%"))
    if entity_type:
        filters.append(AuditLog.entity_type.ilike(f"%{entity_type}%"))
    if role:
        filters.append(AuditLog.actor.has(User.role == role))
    if date_from:
        filters.append(AuditLog.created_at >= date_from)
    if date_to:
        filters.append(AuditLog.created_at <= date_to)
    if search:
        term = f"%{search}%"
        filters.append(
            or_(
                AuditLog.action.ilike(term),
                AuditLog.entity_type.ilike(term),
                AuditLog.request_id.ilike(term),
                AuditLog.actor.has(User.full_name.ilike(term)),
            )
        )

    total_result = await db.execute(select(func.count()).select_from(AuditLog).where(*filters))
    result = await db.execute(
        select(AuditLog)
        .options(selectinload(AuditLog.actor))
        .where(*filters)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    response = PaginatedResponse(
        items=[AuditLogResponse.model_validate(log) for log in result.scalars().all()],
        total=total_result.scalar_one(),
        offset=offset,
        limit=limit,
    )
    await AuditService(db).log(
        action="VIEW",
        entity_type="audit_log",
        new_values={"filters_applied": bool(filters), "result_count": len(response.items)},
        request=request,
        actor_id=user.id,
    )
    return response
