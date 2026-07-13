import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.schemas.certificate import CertificateResponse, CertificateVerifyResponse
from app.services.certificate import CertificateService

router = APIRouter(tags=["Certificates"])


@router.get(
    "/verify/{code}",
    response_model=CertificateVerifyResponse,
    summary="Verify a certificate by code (public endpoint)",
)
async def verify_certificate(
    code: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CertificateVerifyResponse:
    """
    Public verification endpoint — no authentication required.
    Prints on the certificate as: gpsa-uds.edu.gh/verify/{code}
    Returns is_valid=False (not 404) to avoid leaking whether codes exist.
    """
    return await CertificateService(db).verify(code)


@router.get(
    "/mine",
    response_model=list[CertificateResponse],
    summary="Get my certificates",
)
async def my_certificates(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[CertificateResponse]:
    return await CertificateService(db).list_for_user(current_user.id)


@router.post(
    "/issue/{event_id}",
    response_model=list[CertificateResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Bulk-issue certificates for all event registrations (exec/admin only)",
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def issue_certificates(
    event_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[CertificateResponse]:
    """
    Idempotent — safe to call multiple times.
    Already-issued certificates are returned without re-generating.
    """
    return await CertificateService(db).issue_for_event(event_id, current_user, request)
