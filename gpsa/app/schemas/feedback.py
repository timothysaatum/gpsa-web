import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import FeedbackEntityType
from app.schemas.common import AppModel


class FeedbackCreateRequest(AppModel):
    entity_type: FeedbackEntityType
    entity_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class FeedbackResponse(AppModel):
    id: uuid.UUID
    entity_type: FeedbackEntityType
    entity_id: uuid.UUID
    rating: int
    comment: str | None
    created_at: datetime


class FeedbackSummaryResponse(AppModel):
    """Aggregated stats for an entity — used on event/resource detail pages."""

    entity_type: FeedbackEntityType
    entity_id: uuid.UUID
    average_rating: float
    total_count: int
