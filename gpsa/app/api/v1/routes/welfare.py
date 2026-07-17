"""
Welfare (PharmaCare) — schemas and routes.
Business logic is delegated to WelfareService.
"""

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.db.session import get_db
from app.models.enums import ReportStatus, ReportType, WelfareCategory
from app.schemas.common import AppModel, PaginatedResponse
from app.services.welfare import WelfareService


# ── Schemas ───────────────────────────────────────────────────────────────────

class WelfareReportRequest(AppModel):
    report_type: ReportType
    category: WelfareCategory
    description: str = Field(min_length=10)
    is_anonymous: bool = False
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
    report = await WelfareService(db).submit_report(
        payload=payload.model_dump(),
        request=request,
    )
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
    svc = WelfareService(db)
    reports, total = await svc.list_reports(
        actor=current_user,
        report_type=report_type,
        report_status=report_status,
        offset=offset,
        limit=limit,
    )
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
    report = await WelfareService(db).resolve_report(
        report_id=report_id,
        status=payload.status,
        admin_notes=payload.admin_notes,
        actor=current_user,
        request=request,
    )
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
    spotlight = await WelfareService(db).get_spotlight()
    return SpotlightResponse.model_validate(spotlight) if spotlight else None


@router.get(
    "/config",
    response_model=dict,
    summary="Welfare page configuration (emergency contact, trust items, stats)",
)
async def get_welfare_config(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return await WelfareService(db).get_config()


@router.get(
    "/stats",
    response_model=dict,
    summary="Welfare report statistics",
)
async def get_welfare_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return await WelfareService(db).get_stats()


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
    spotlight = await WelfareService(db).create_spotlight(
        summary=payload.summary,
        action_taken=payload.action_taken,
        actor=current_user,
        request=request,
    )
    return SpotlightResponse.model_validate(spotlight)
