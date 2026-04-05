"""
Welfare (PharmaCare) — schemas, repository, service, and routes.
"""

import uuid
from datetime import UTC, datetime
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.core.permissions import assert_permission, can_resolve_welfare_report, can_view_welfare_reports, can_manage_spotlight
from app.db.session import get_db
from app.models.enums import ReportStatus, ReportType, UserRole, WelfareCategory
from app.models.welfare import WelfareReport, WelfareSpotlight
from app.repositories.base import BaseRepository
from app.schemas.common import AppModel, MessageResponse, PaginatedResponse
from app.services.audit import AuditService
from app.services.email import EmailService

logger = structlog.get_logger(__name__)


# ── Schemas ───────────────────────────────────────────────────────────────────

class WelfareReportRequest(AppModel):
    report_type: ReportType
    category: WelfareCategory
    description: str = Field(min_length=10)
    is_anonymous: bool = False
    # Optional — required only when not anonymous
    name: str | None = Field(default=None, max_length=255)
    level: int | None = Field(default=None, ge=100, le=600)
    contact: str | None = Field(default=None, max_length=255)


class WelfareReportResponse(AppModel):
    id: uuid.UUID
    report_type: ReportType
    category: WelfareCategory
    description: str
    is_anonymous: bool
    name: str | None
    level: int | None
    status: ReportStatus
    submitted_at: datetime


class AdminWelfareReportResponse(WelfareReportResponse):
    """Extended view for exec/admin — includes contact and admin notes."""
    contact: str | None
    admin_notes: str | None
    resolved_at: datetime | None


class ResolveReportRequest(AppModel):
    status: ReportStatus
    admin_notes: str | None = None


class SpotlightCreateRequest(AppModel):
    summary: str = Field(min_length=10)
    action_taken: str = Field(min_length=5)


class SpotlightResponse(AppModel):
    id: uuid.UUID
    summary: str
    action_taken: str
    is_active: bool
    created_at: datetime


# ── Repositories ──────────────────────────────────────────────────────────────

class WelfareReportRepository(BaseRepository[WelfareReport]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(WelfareReport, db)

    async def list_filtered(
        self,
        *,
        report_type: ReportType | None = None,
        status: ReportStatus | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[WelfareReport]:
        q = self._base_query()
        if report_type:
            q = q.where(WelfareReport.report_type == report_type)
        if status:
            q = q.where(WelfareReport.status == status)
        q = q.order_by(WelfareReport.submitted_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())


class WelfareSpotlightRepository(BaseRepository[WelfareSpotlight]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(WelfareSpotlight, db)

    async def get_active(self) -> WelfareSpotlight | None:
        result = await self.db.execute(
            self._base_query().where(WelfareSpotlight.is_active.is_(True)).limit(1)
        )
        return result.scalar_one_or_none()

    async def deactivate_all(self) -> None:
        from sqlalchemy import update
        await self.db.execute(
            update(WelfareSpotlight)
            .where(WelfareSpotlight.is_active.is_(True))
            .values(is_active=False)
        )
        await self.db.flush()


# ── Routes ────────────────────────────────────────────────────────────────────

router = APIRouter(tags=["Welfare"])


@router.post(
    "/reports",
    response_model=WelfareReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a welfare report or support request",
)
async def submit_report(
    payload: WelfareReportRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WelfareReportResponse:
    repo = WelfareReportRepository(db)

    data: dict = {
        "report_type": payload.report_type,
        "category": payload.category,
        "description": payload.description,
        "is_anonymous": payload.is_anonymous,
        "status": ReportStatus.pending,
        "submitted_at": datetime.now(UTC),
    }

    # For confidential reports — strip identifying data entirely
    if payload.report_type == ReportType.confidential or payload.is_anonymous:
        data["name"] = None
        data["level"] = None
        data["contact"] = None
        # Strip request context so audit log doesn't capture IP either
        request.state.ip_address = None
        request.state.user_agent = None
    else:
        data["name"] = payload.name
        data["level"] = payload.level
        data["contact"] = payload.contact

    report = await repo.create(data)

    # Email confirmation if contact provided and not confidential
    if data.get("contact") and "@" in str(data.get("contact")):
        ref = str(report.id)[:8].upper()
        await EmailService(db).send_welfare_report_received(data["contact"], ref)

    # Audit — no actor_id for anonymous; no IP for confidential
    await AuditService(db).log(
        action="SUBMIT",
        entity_type="welfare_report",
        entity_id=report.id,
        new_values={"type": payload.report_type, "category": payload.category},
        request=request if not (payload.is_anonymous or payload.report_type == ReportType.confidential) else None,
    )
    await db.commit()
    await db.refresh(report)
    return WelfareReportResponse.model_validate(report)


@router.get(
    "/reports",
    response_model=PaginatedResponse[AdminWelfareReportResponse],
    summary="List welfare reports (exec/admin only)",
)
async def list_reports(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    report_type: ReportType | None = None,
    report_status: ReportStatus | None = None,
    offset: int = 0,
    limit: int = 20,
) -> PaginatedResponse[AdminWelfareReportResponse]:
    assert_permission(can_view_welfare_reports(current_user))
    repo = WelfareReportRepository(db)
    reports = await repo.list_filtered(
        report_type=report_type, status=report_status, offset=offset, limit=limit
    )
    total = await repo.count()
    return PaginatedResponse(
        items=[AdminWelfareReportResponse.model_validate(r) for r in reports],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.patch(
    "/reports/{report_id}/resolve",
    response_model=AdminWelfareReportResponse,
    summary="Update report status (exec/admin only)",
)
async def resolve_report(
    report_id: uuid.UUID,
    payload: ResolveReportRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AdminWelfareReportResponse:
    assert_permission(can_resolve_welfare_report(current_user))
    repo = WelfareReportRepository(db)
    report = await repo.get_by_id_or_404(report_id)

    old_status = report.status
    updates: dict = {"status": payload.status, "admin_notes": payload.admin_notes}
    if payload.status == ReportStatus.resolved:
        updates["resolved_by"] = current_user.id
        updates["resolved_at"] = datetime.now(UTC)

    report = await repo.update(report, updates)

    # Notify submitter if contact available and status changed
    if report.contact and "@" in report.contact and report.status != old_status:
        await EmailService(db).send_welfare_status_update(
            to=report.contact,
            full_name=report.name or "Student",
            new_status=payload.status.value,
            admin_notes=payload.admin_notes,
        )

    await AuditService(db).log(
        action="UPDATE",
        entity_type="welfare_report",
        entity_id=report.id,
        old_values={"status": old_status},
        new_values={"status": payload.status},
        request=request,
    )
    await db.commit()
    await db.refresh(report)
    return AdminWelfareReportResponse.model_validate(report)


# ── Spotlight ─────────────────────────────────────────────────────────────────

@router.get(
    "/spotlight",
    response_model=SpotlightResponse | None,
    summary="Get the active Issue of the Week",
)
async def get_spotlight(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SpotlightResponse | None:
    spotlight = await WelfareSpotlightRepository(db).get_active()
    return SpotlightResponse.model_validate(spotlight) if spotlight else None


@router.post(
    "/spotlight",
    response_model=SpotlightResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Set a new Issue of the Week (exec/admin only)",
)
async def create_spotlight(
    payload: SpotlightCreateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SpotlightResponse:
    assert_permission(can_manage_spotlight(current_user))
    repo = WelfareSpotlightRepository(db)

    # Only one active spotlight at a time
    await repo.deactivate_all()

    spotlight = await repo.create({
        "summary": payload.summary,
        "action_taken": payload.action_taken,
        "is_active": True,
    })
    await AuditService(db).log(
        action="CREATE",
        entity_type="welfare_spotlight",
        entity_id=spotlight.id,
        request=request,
    )
    await db.commit()
    await db.refresh(spotlight)
    return SpotlightResponse.model_validate(spotlight)
