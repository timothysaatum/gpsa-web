import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import require_roles
from app.db.session import get_db
from app.models.academic_resource import AcademicResource
from app.models.audit import AuditLog
from app.models.event import Event
from app.models.gallery import GalleryImage
from app.models.news import NewsPost
from app.models.opportunity import Opportunity
from app.models.user import User
from app.models.welfare import WelfareReport
from app.models.enums import ReportStatus, UserRole
from app.schemas.common import AppModel, PaginatedResponse


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
    dependencies=[Depends(require_roles(UserRole.admin, UserRole.exec))],
)
async def dashboard(db: Annotated[AsyncSession, Depends(get_db)]) -> AdminDashboardResponse:
    recent = await db.execute(
        select(AuditLog)
        .options(selectinload(AuditLog.actor))
        .order_by(AuditLog.created_at.desc())
        .limit(8)
    )

    return AdminDashboardResponse(
        users=await _count(db, User, User.deleted_at.is_(None)),
        news_posts=await _count(db, NewsPost, NewsPost.deleted_at.is_(None)),
        events=await _count(db, Event, Event.deleted_at.is_(None)),
        opportunities=await _count(db, Opportunity, Opportunity.deleted_at.is_(None)),
        gallery_images=await _count(db, GalleryImage, GalleryImage.deleted_at.is_(None)),
        academic_resources=await _count(db, AcademicResource, AcademicResource.deleted_at.is_(None)),
        welfare_reports=await _count(db, WelfareReport, WelfareReport.deleted_at.is_(None)),
        pending_welfare_reports=await _count(
            db,
            WelfareReport,
            WelfareReport.deleted_at.is_(None),
            WelfareReport.status == ReportStatus.pending,
        ),
        recent_audit=[AuditLogResponse.model_validate(log) for log in recent.scalars().all()],
    )


@router.get(
    "/audit-logs",
    response_model=PaginatedResponse[AuditLogResponse],
    summary="List audit logs",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def audit_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    actor_id: uuid.UUID | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    offset: int = 0,
    limit: int = 50,
) -> PaginatedResponse[AuditLogResponse]:
    filters = []
    if actor_id:
        filters.append(AuditLog.actor_id == actor_id)
    if action:
        filters.append(AuditLog.action.ilike(f"%{action}%"))
    if entity_type:
        filters.append(AuditLog.entity_type.ilike(f"%{entity_type}%"))

    total_result = await db.execute(select(func.count()).select_from(AuditLog).where(*filters))
    result = await db.execute(
        select(AuditLog)
        .options(selectinload(AuditLog.actor))
        .where(*filters)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    return PaginatedResponse(
        items=[AuditLogResponse.model_validate(log) for log in result.scalars().all()],
        total=total_result.scalar_one(),
        offset=offset,
        limit=limit,
    )
