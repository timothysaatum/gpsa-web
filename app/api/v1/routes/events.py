"""Events service — create, update, list, register, cancel."""

import uuid
from datetime import UTC, datetime
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, OptionalUser, require_roles
from app.core.permissions import assert_permission, can_create_event, can_publish_event
from app.db.session import get_db
from app.models.enums import EventStatus, EventType, UserRole
from app.repositories.event import EventRegistrationRepository, EventRepository
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.event import (
    EventCreateRequest,
    EventRegistrationRequest,
    EventRegistrationResponse,
    EventResponse,
    EventSummaryResponse,
    EventUpdateRequest,
)
from app.services.audit import AuditService
from app.services.email import EmailService

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["Events"])


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=PaginatedResponse[EventSummaryResponse],
    summary="List events with optional filters",
)
async def list_events(
    db: Annotated[AsyncSession, Depends(get_db)],
    event_status: EventStatus | None = None,
    event_type: EventType | None = None,
    offset: int = 0,
    limit: int = 20,
) -> PaginatedResponse[EventSummaryResponse]:
    repo = EventRepository(db)
    events = await repo.list_filtered(
        status=event_status, event_type=event_type, offset=offset, limit=limit
    )
    total = await repo.count()
    return PaginatedResponse(
        items=[EventSummaryResponse.model_validate(e) for e in events],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get(
    "/featured",
    response_model=EventResponse | None,
    summary="Get the current featured event",
)
async def get_featured_event(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EventResponse | None:
    event = await EventRepository(db).get_featured()
    return EventResponse.model_validate(event) if event else None


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="Get a single event by ID",
)
async def get_event(
    event_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EventResponse:
    event = await EventRepository(db).get_by_id_or_404(event_id)
    return EventResponse.model_validate(event)


@router.post(
    "/",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an event (exec/admin only)",
)
async def create_event(
    payload: EventCreateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EventResponse:
    assert_permission(can_create_event(current_user))
    repo = EventRepository(db)

    event = await repo.create({
        **payload.model_dump(),
        "status": EventStatus.upcoming,
        "created_by": current_user.id,
    })
    await AuditService(db).log(
        action="CREATE",
        entity_type="event",
        entity_id=event.id,
        new_values={"title": event.title, "start_datetime": str(event.start_datetime)},
        request=request,
    )
    await db.commit()
    await db.refresh(event)
    return EventResponse.model_validate(event)


@router.patch(
    "/{event_id}",
    response_model=EventResponse,
    summary="Update an event (exec/admin only)",
)
async def update_event(
    event_id: uuid.UUID,
    payload: EventUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EventResponse:
    assert_permission(can_create_event(current_user))
    repo = EventRepository(db)
    event = await repo.get_by_id_or_404(event_id)
    updates = payload.model_dump(exclude_none=True)

    # Publishing requires admin
    if "status" in updates and not can_publish_event(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can change event status.",
        )

    old_values = {k: str(getattr(event, k)) for k in updates}
    event = await repo.update(event, updates)
    await AuditService(db).log(
        action="UPDATE",
        entity_type="event",
        entity_id=event.id,
        old_values=old_values,
        new_values={k: str(v) for k, v in updates.items()},
        request=request,
    )
    await db.commit()
    await db.refresh(event)
    return EventResponse.model_validate(event)


@router.delete(
    "/{event_id}",
    response_model=MessageResponse,
    summary="Soft-delete an event (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def delete_event(
    event_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    repo = EventRepository(db)
    event = await repo.get_by_id_or_404(event_id)
    await repo.soft_delete(event)
    await AuditService(db).log(
        action="DELETE", entity_type="event", entity_id=event.id, request=request
    )
    await db.commit()
    return MessageResponse(message="Event deleted.")


# ── Registrations ─────────────────────────────────────────────────────────────

@router.post(
    "/{event_id}/register",
    response_model=EventRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register for an event",
)
async def register_for_event(
    event_id: uuid.UUID,
    payload: EventRegistrationRequest,
    request: Request,
    current_user: OptionalUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EventRegistrationResponse:
    event = await EventRepository(db).get_by_id_or_404(event_id)

    if event.status == EventStatus.past:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This event has already ended. Registration is closed.",
        )

    reg_repo = EventRegistrationRepository(db)

    # Prevent duplicate registration for logged-in users
    if current_user:
        existing = await reg_repo.get_by_event_and_user(event_id, current_user.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already registered for this event.",
            )

    registration = await reg_repo.create({
        "event_id": event_id,
        "user_id": current_user.id if current_user else None,
        "full_name": payload.full_name,
        "level": payload.level,
        "contact": payload.contact,
        "notes": payload.notes,
        "registered_at": datetime.now(UTC),
    })

    # Send confirmation email if contact provided
    if payload.contact and "@" in payload.contact:
        await EmailService(db).send_event_registration_confirmation(
            to=payload.contact,
            full_name=payload.full_name,
            event_title=event.title,
            event_date=str(event.start_datetime.date()),
            location=event.location,
        )

    await AuditService(db).log(
        action="CREATE",
        entity_type="event_registration",
        entity_id=registration.id,
        new_values={"event_id": str(event_id), "full_name": payload.full_name},
        request=request,
        actor_id=current_user.id if current_user else None,
    )
    await db.commit()
    await db.refresh(registration)
    return EventRegistrationResponse.model_validate(registration)


@router.delete(
    "/{event_id}/register",
    response_model=MessageResponse,
    summary="Cancel event registration (authenticated users only)",
)
async def cancel_registration(
    event_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    repo = EventRegistrationRepository(db)
    registration = await repo.get_by_event_and_user(event_id, current_user.id)

    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not registered for this event.",
        )

    await repo.soft_delete(registration)
    await AuditService(db).log(
        action="DELETE",
        entity_type="event_registration",
        entity_id=registration.id,
        request=request,
    )
    await db.commit()
    return MessageResponse(message="Registration cancelled.")


@router.get(
    "/{event_id}/registrations",
    response_model=list[EventRegistrationResponse],
    summary="List registrations for an event (exec/admin only)",
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def list_registrations(
    event_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[EventRegistrationResponse]:
    await EventRepository(db).get_by_id_or_404(event_id)
    regs = await EventRegistrationRepository(db).list_for_event(event_id)
    return [EventRegistrationResponse.model_validate(r) for r in regs]
