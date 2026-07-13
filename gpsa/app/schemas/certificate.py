import uuid
from datetime import datetime

from app.schemas.common import AppModel


class CertificateResponse(AppModel):
    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    verification_code: str
    download_url: str | None = None   # resolved from certificate_key at API layer
    issued_at: datetime


class CertificateVerifyResponse(AppModel):
    """Public endpoint — no PII, just enough to confirm authenticity."""
    verification_code: str
    event_title: str
    recipient_name: str
    issued_at: datetime
    is_valid: bool


class IssueCertificatesRequest(AppModel):
    """Bulk issue to all registrations for an event."""
    event_id: uuid.UUID
