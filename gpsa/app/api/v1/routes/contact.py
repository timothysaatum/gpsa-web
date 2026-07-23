import secrets
import uuid
from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import EmailStr, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.contact import ContactSubmission
from app.models.enums import UserRole
from app.repositories.base import BaseRepository
from app.schemas.common import AppModel, MessageResponse, PaginatedResponse
from app.services.audit import AuditService

router = APIRouter(tags=["Contact"])

ContactCategory = Literal["general", "membership", "academics", "events", "partnership", "media", "other"]
ContactStatus = Literal["pending", "in_progress", "resolved", "spam"]


class ContactCreateRequest(AppModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    category: ContactCategory = "general"
    subject: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=20, max_length=5000)
    consent: bool
    website: str = Field(default="", max_length=0)

    @field_validator("full_name", "subject", "message")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field is required.")
        return value


class ContactUpdateRequest(AppModel):
    status: ContactStatus | None = None
    admin_notes: str | None = Field(default=None, max_length=5000)
    assigned_to: uuid.UUID | None = None


class ContactSubmissionResponse(AppModel):
    id: uuid.UUID
    reference: str
    full_name: str
    email: str
    phone: str | None
    category: str
    subject: str
    message: str
    status: str
    admin_notes: str | None
    assigned_to: uuid.UUID | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ContactCreatedResponse(AppModel):
    reference: str
    message: str


@router.post("/", response_model=ContactCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_contact_submission(
    payload: ContactCreateRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ContactCreatedResponse:
    if not payload.consent:
        raise HTTPException(status_code=422, detail="Consent is required to submit this form.")
    reference = f"GPSA-{datetime.now(UTC):%y%m}-{secrets.token_hex(3).upper()}"
    submission = await BaseRepository(ContactSubmission, db).create({
        "reference": reference,
        "full_name": payload.full_name,
        "email": str(payload.email).lower(),
        "phone": payload.phone.strip() if payload.phone else None,
        "category": payload.category,
        "subject": payload.subject,
        "message": payload.message,
    })
    await AuditService(db).log(
        action="CREATE", entity_type="contact_submission", entity_id=submission.id,
        new_values={"reference": reference, "category": payload.category}, request=request,
    )
    await db.commit()
    return ContactCreatedResponse(
        reference=reference,
        message="Your message has been received. Please keep the reference for follow-up.",
    )


@router.get(
    "/admin",
    response_model=PaginatedResponse[ContactSubmissionResponse],
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def list_contact_submissions(
    db: Annotated[AsyncSession, Depends(get_db)],
    contact_status: ContactStatus | None = None,
    search: str | None = None,
    offset: int = 0,
    limit: int = 50,
) -> PaginatedResponse[ContactSubmissionResponse]:
    filters = [ContactSubmission.deleted_at.is_(None)]
    if contact_status:
        filters.append(ContactSubmission.status == contact_status)
    if search:
        pattern = f"%{search.strip()}%"
        filters.append(
            ContactSubmission.reference.ilike(pattern)
            | ContactSubmission.full_name.ilike(pattern)
            | ContactSubmission.email.ilike(pattern)
            | ContactSubmission.subject.ilike(pattern)
        )
    query = select(ContactSubmission).where(*filters).order_by(ContactSubmission.created_at.desc())
    result = await db.execute(query.offset(offset).limit(min(limit, 200)))
    count = await db.scalar(select(func.count()).select_from(ContactSubmission).where(*filters))
    return PaginatedResponse(
        items=[ContactSubmissionResponse.model_validate(item) for item in result.scalars().all()],
        total=count or 0, offset=offset, limit=min(limit, 200),
    )


@router.patch(
    "/admin/{submission_id}",
    response_model=ContactSubmissionResponse,
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def update_contact_submission(
    submission_id: uuid.UUID,
    payload: ContactUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ContactSubmissionResponse:
    repo = BaseRepository(ContactSubmission, db)
    submission = await repo.get_by_id_or_404(submission_id)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    if updates.get("status") == "resolved":
        updates["resolved_at"] = datetime.now(UTC)
    elif "status" in updates:
        updates["resolved_at"] = None
    submission = await repo.update(submission, updates)
    await AuditService(db).log(
        action="UPDATE", entity_type="contact_submission", entity_id=submission.id,
        new_values={key: str(value) for key, value in updates.items()}, request=request,
    )
    await db.commit()
    return ContactSubmissionResponse.model_validate(submission)


@router.delete(
    "/admin/{submission_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def delete_contact_submission(
    submission_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    repo = BaseRepository(ContactSubmission, db)
    submission = await repo.get_by_id_or_404(submission_id)
    await repo.soft_delete(submission)
    await AuditService(db).log(
        action="DELETE", entity_type="contact_submission", entity_id=submission.id, request=request,
    )
    await db.commit()
    return MessageResponse(message="Contact submission deleted.")
