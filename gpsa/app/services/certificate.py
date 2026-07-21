"""
Certificate service — issue and verify participation certificates.

PDF generation is stubbed here with a placeholder that writes a minimal
text-based PDF. Replace _generate_pdf() with a proper template renderer
(e.g. WeasyPrint + Jinja2, or ReportLab) for production.
"""

import uuid
from datetime import UTC, datetime

import structlog
from fastapi import HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import assert_permission, can_issue_certificates
from app.domain.bus import bus as domain_bus
from app.domain.events import CertificateIssued
from app.domain.kernel import DomainEventBus
from app.models.certificate import Certificate
from app.models.user import User
from app.repositories.certificate import CertificateRepository
from app.repositories.event import EventRegistrationRepository, EventRepository
from app.schemas.certificate import CertificateResponse, CertificateVerifyResponse
from app.services.audit import AuditService
from app.services.notification import NotificationService
from app.services.storage import storage
from app.utils.slug import make_certificate_code, make_slug

logger = structlog.get_logger(__name__)


class CertificateService:
    def __init__(self, db: AsyncSession, bus: DomainEventBus | None = None) -> None:
        self.db = db
        self.repo = CertificateRepository(db)
        self.events = EventRepository(db)
        self.registrations = EventRegistrationRepository(db)
        self.audit = AuditService(db)
        self.notifications = NotificationService(db)
        self.bus = bus or domain_bus

    # ── Issue ─────────────────────────────────────────────────────────────────

    async def issue_for_event(
        self, event_id: uuid.UUID, actor: User, request: Request
    ) -> list[CertificateResponse]:
        """
        Bulk-issue certificates to all registered attendees of an event.
        Skips users who already have a certificate for this event.
        """
        assert_permission(can_issue_certificates(actor))

        event = await self.events.get_by_id_or_404(event_id)
        registrations = await self.registrations.list_for_event(event_id)

        if not registrations:
            raise HTTPException(
                status_code=400,
                detail="No registrations found for this event.",
            )

        issued: list[CertificateResponse] = []
        cert_events: list[CertificateIssued] = []

        for reg in registrations:
            if reg.user_id is None:
                continue  # skip guest (non-account) registrations

            # Idempotent — skip if already issued
            existing = await self.repo.get_for_user_and_event(reg.user_id, event_id)
            if existing:
                issued.append(await self._to_response(existing))
                continue

            # Generate verification code
            code = make_certificate_code(make_slug(event.title), event.start_datetime.year)

            # Generate PDF and upload to R2/S3
            pdf_bytes = self._generate_pdf(
                recipient_name=reg.full_name,
                event_title=event.title,
                event_date=str(event.start_datetime.date()),
                verification_code=code,
            )
            cert_key = await storage.upload(
                content=pdf_bytes,
                folder="certificates",
                filename=f"{code}.pdf",
                mime_type="application/pdf",
                public=False,
            )

            cert = await self.repo.create(
                {
                    "event_id": event_id,
                    "user_id": reg.user_id,
                    "registration_id": reg.id,
                    "verification_code": code,
                    "certificate_key": cert_key,
                    "issued_at": datetime.now(UTC),
                }
            )

            cert_events.append(
                CertificateIssued(
                    certificate_id=cert.id,
                    event_id=event_id,
                    user_id=reg.user_id,
                )
            )
            # Notify the student
            await self.notifications.certificate_issued(reg.user_id, cert.id, event.title)

            await self.audit.log(
                action="CREATE",
                entity_type="certificate",
                entity_id=cert.id,
                new_values={"event_id": str(event_id), "user_id": str(reg.user_id), "code": code},
                request=request,
            )
            issued.append(await self._to_response(cert))

        await self.db.commit()
        logger.info("certificates_issued", event_id=str(event_id), count=len(issued))
        for evt in cert_events:
            await self.bus.publish_async(evt)
        return issued

    # ── Verify (public endpoint) ──────────────────────────────────────────────

    async def verify(self, code: str) -> CertificateVerifyResponse:
        cert = await self.repo.get_by_verification_code(code.upper())
        if cert is None:
            return CertificateVerifyResponse(
                verification_code=code,
                event_title="",
                recipient_name="",
                issued_at=datetime.now(UTC),
                is_valid=False,
            )
        return CertificateVerifyResponse(
            verification_code=cert.verification_code,
            event_title=cert.event.title,
            recipient_name=cert.user.full_name,
            issued_at=cert.issued_at,
            is_valid=True,
        )

    # ── User's own certificates ───────────────────────────────────────────────

    async def list_for_user(self, user_id: uuid.UUID) -> list[CertificateResponse]:
        certs = await self.repo.list_for_user(user_id)
        results = []
        for c in certs:
            results.append(await self._to_response(c))
        return results

    # ── Internal ──────────────────────────────────────────────────────────────

    async def _to_response(self, cert: Certificate) -> CertificateResponse:
        download_url = await storage.presign(cert.certificate_key, expires_in=3600)
        resp = CertificateResponse.model_validate(cert)
        resp.download_url = download_url
        return resp

    def _generate_pdf(
        self,
        recipient_name: str,
        event_title: str,
        event_date: str,
        verification_code: str,
    ) -> bytes:
        """
        Minimal PDF stub — replace with WeasyPrint/ReportLab for production.

        This produces a valid but visually plain PDF that satisfies the
        storage pipeline without requiring extra dependencies at this stage.
        """
        content = (
            f"GPSA-UDS Certificate of Participation\n\n"
            f"This is to certify that\n\n"
            f"  {recipient_name}\n\n"
            f"participated in\n\n"
            f"  {event_title}\n"
            f"  held on {event_date}\n\n"
            f"Verification Code: {verification_code}\n"
            f"Verify at: https://gpsa-uds.edu.gh/verify/{verification_code}\n"
        )
        # Minimal valid PDF envelope
        body = content.encode()
        pdf = (
            b"%PDF-1.4\n"
            b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
            b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R"
            b"/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>>>endobj\n"
            b"4 0 obj<</Length " + str(len(body)).encode() + b">>\n"
            b"stream\n" + body + b"\nendstream\nendobj\n"
            b"xref\n0 5\n"
            b"0000000000 65535 f \n"
            b"trailer<</Size 5/Root 1 0 R>>\n"
            b"startxref\n9\n%%EOF"
        )
        return pdf
