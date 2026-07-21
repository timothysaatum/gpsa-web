import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.db.session import get_db
from app.domain.bus import bus as domain_bus
from app.domain.events import FeedbackSubmitted
from app.models.enums import FeedbackEntityType
from app.repositories.feedback import FeedbackRepository
from app.schemas.feedback import (
    FeedbackCreateRequest,
    FeedbackResponse,
    FeedbackSummaryResponse,
)
from app.services.audit import AuditService

router = APIRouter(tags=["Feedback"])


@router.post(
    "/",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit feedback for an event or resource",
)
async def submit_feedback(
    payload: FeedbackCreateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FeedbackResponse:
    repo = FeedbackRepository(db)

    existing = await repo.get_by_user_and_entity(
        current_user.id, payload.entity_type, payload.entity_id
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already submitted feedback for this item.",
        )

    data: dict = {
        "entity_type": payload.entity_type,
        "entity_id": payload.entity_id,
        "rating": payload.rating,
        "comment": payload.comment,
        "submitted_by": current_user.id,
    }

    fb = await repo.create(data)
    await AuditService(db).log(
        action="CREATE",
        entity_type="feedback",
        entity_id=fb.id,
        new_values={"entity_type": payload.entity_type, "rating": payload.rating},
        request=request,
    )
    await db.commit()
    await domain_bus.publish_async(
        FeedbackSubmitted(
            feedback_id=fb.id,
            entity_type=str(payload.entity_type),
            entity_id=payload.entity_id,
            rating=payload.rating,
        )
    )
    return FeedbackResponse.model_validate(fb)


@router.get(
    "/{entity_type}/{entity_id}/summary",
    response_model=FeedbackSummaryResponse,
    summary="Get aggregated rating for an entity",
)
async def get_feedback_summary(
    entity_type: FeedbackEntityType,
    entity_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> FeedbackSummaryResponse:
    avg, count = await FeedbackRepository(db).get_summary(entity_type, entity_id)
    return FeedbackSummaryResponse(
        entity_type=entity_type,
        entity_id=entity_id,
        average_rating=avg,
        total_count=count,
    )


@router.get(
    "/{entity_type}/{entity_id}",
    response_model=list[FeedbackResponse],
    summary="List feedback for an entity",
)
async def list_feedback(
    entity_type: FeedbackEntityType,
    entity_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    offset: int = 0,
    limit: int = 20,
) -> list[FeedbackResponse]:
    items = await FeedbackRepository(db).list_for_entity(
        entity_type, entity_id, offset=offset, limit=limit
    )
    return [FeedbackResponse.model_validate(f) for f in items]
