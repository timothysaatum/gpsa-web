"""
Welfare (PharmaCare) service — coordinates repositories, permissions,
email notifications, and audit for welfare reports and spotlight.
"""

import uuid
from datetime import UTC, datetime
from typing import Any

import structlog
from fastapi import Request
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import (
    assert_permission,
    can_manage_spotlight,
    can_resolve_welfare_report,
    can_view_welfare_reports,
)
from app.domain.bus import bus as domain_bus
from app.domain.events import ReportResolved, ReportSubmitted
from app.domain.kernel import DomainEventBus
from app.models.enums import ReportStatus, ReportType
from app.models.welfare import WelfareReport, WelfareSpotlight
from app.repositories.base import BaseRepository
from app.services.audit import AuditService
from app.services.email import EmailService

logger = structlog.get_logger(__name__)


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

    async def count_filtered(
        self,
        *,
        report_type: ReportType | None = None,
        status: ReportStatus | None = None,
    ) -> int:
        q = select(func.count()).select_from(WelfareReport).where(
            WelfareReport.deleted_at.is_(None)
        )
        if report_type:
            q = q.where(WelfareReport.report_type == report_type)
        if status:
            q = q.where(WelfareReport.status == status)
        result = await self.db.execute(q)
        return result.scalar_one()


class WelfareSpotlightRepository(BaseRepository[WelfareSpotlight]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(WelfareSpotlight, db)

    async def get_active(self) -> WelfareSpotlight | None:
        result = await self.db.execute(
            self._base_query().where(WelfareSpotlight.is_active.is_(True)).limit(1)
        )
        return result.scalar_one_or_none()

    async def deactivate_all(self) -> None:
        await self.db.execute(
            update(WelfareSpotlight)
            .where(WelfareSpotlight.is_active.is_(True))
            .values(is_active=False)
        )
        await self.db.flush()


class WelfareService:
    def __init__(self, db: AsyncSession, bus: DomainEventBus | None = None) -> None:
        self.db = db
        self.reports = WelfareReportRepository(db)
        self.spotlight_repo = WelfareSpotlightRepository(db)
        self.audit = AuditService(db)
        self.email = EmailService(db)
        self.bus = bus or domain_bus

    async def submit_report(
        self, payload: dict[str, Any], request: Request
    ) -> WelfareReport:
        data: dict = {
            "report_type": payload["report_type"],
            "category": payload["category"],
            "description": payload["description"],
            "is_anonymous": payload.get("is_anonymous", False),
            "status": ReportStatus.pending,
            "submitted_at": datetime.now(UTC),
        }

        is_confidential = (
            payload["report_type"] == ReportType.confidential or data["is_anonymous"]
        )
        if is_confidential:
            data["name"] = None
            data["level"] = None
            data["contact"] = None
            request.state.ip_address = None
            request.state.user_agent = None
        else:
            data["name"] = payload.get("name")
            data["level"] = payload.get("level")
            data["contact"] = payload.get("contact")

        report = await self.reports.create(data)

        contact = data.get("contact")
        if contact and "@" in str(contact):
            ref = str(report.id)[:8].upper()
            await self.email.send_welfare_report_received(contact, ref)

        await self.audit.log(
            action="SUBMIT",
            entity_type="welfare_report",
            entity_id=report.id,
            new_values={"type": payload["report_type"], "category": payload["category"]},
            request=request if not is_confidential else None,
        )
        await self.db.commit()
        await self.bus.publish_async(ReportSubmitted(
            report_id=report.id,
            report_type=str(payload["report_type"]),
            category=str(payload["category"]),
        ))
        return report

    async def list_reports(
        self,
        actor,
        report_type: ReportType | None = None,
        report_status: ReportStatus | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[WelfareReport], int]:
        assert_permission(can_view_welfare_reports(actor))
        reports = await self.reports.list_filtered(
            report_type=report_type, status=report_status, offset=offset, limit=limit
        )
        total = await self.reports.count_filtered(
            report_type=report_type, status=report_status
        )
        return reports, total

    async def resolve_report(
        self,
        report_id: uuid.UUID,
        status: ReportStatus,
        admin_notes: str | None,
        actor,
        request: Request,
    ) -> WelfareReport:
        assert_permission(can_resolve_welfare_report(actor))
        report = await self.reports.get_by_id_or_404(report_id)

        old_status = report.status
        updates: dict = {"status": status, "admin_notes": admin_notes}
        if status == ReportStatus.resolved:
            updates["resolved_by"] = actor.id
            updates["resolved_at"] = datetime.now(UTC)

        report = await self.reports.update(report, updates)

        if report.contact and "@" in report.contact and report.status != old_status:
            await self.email.send_welfare_status_update(
                to=report.contact,
                full_name=report.name or "Student",
                new_status=status.value,
                admin_notes=admin_notes,
            )

        await self.audit.log(
            action="UPDATE",
            entity_type="welfare_report",
            entity_id=report.id,
            old_values={"status": old_status},
            new_values={"status": status},
            request=request,
        )
        await self.db.commit()
        await self.bus.publish_async(ReportResolved(
            report_id=report.id, new_status=str(status),
        ))
        return report

    async def get_spotlight(self) -> WelfareSpotlight | None:
        return await self.spotlight_repo.get_active()

    async def create_spotlight(
        self, summary: str, action_taken: str, actor, request: Request
    ) -> WelfareSpotlight:
        assert_permission(can_manage_spotlight(actor))
        await self.spotlight_repo.deactivate_all()
        spotlight = await self.spotlight_repo.create({
            "summary": summary,
            "action_taken": action_taken,
            "is_active": True,
        })
        await self.audit.log(
            action="CREATE",
            entity_type="welfare_spotlight",
            entity_id=spotlight.id,
            request=request,
        )
        await self.db.commit()
        return spotlight
