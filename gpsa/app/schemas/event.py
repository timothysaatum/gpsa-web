import uuid
from datetime import datetime

from pydantic import Field, model_validator

from app.models.enums import EventStatus, EventType
from app.schemas.common import AppModel
from app.schemas.user import UserSummaryResponse


class EventCreateRequest(AppModel):
    title: str = Field(min_length=3, max_length=500)
    description: str = Field(min_length=10)
    event_type: EventType
    start_datetime: datetime
    end_datetime: datetime | None = None
    location: str = Field(min_length=2, max_length=500)
    banner_emoji: str | None = Field(default=None, max_length=10)
    is_featured: bool = False
    agenda: dict | None = None
    speakers: list | None = None

    @model_validator(mode="after")
    def validate_dates(self) -> "EventCreateRequest":
        if self.end_datetime and self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be after start_datetime")
        return self


class EventUpdateRequest(AppModel):
    title: str | None = Field(default=None, min_length=3, max_length=500)
    description: str | None = None
    event_type: EventType | None = None
    status: EventStatus | None = None
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    location: str | None = None
    banner_emoji: str | None = None
    is_featured: bool | None = None
    agenda: dict | None = None
    speakers: list | None = None


class EventResponse(AppModel):
    id: uuid.UUID
    title: str
    description: str
    event_type: EventType
    status: EventStatus
    start_datetime: datetime
    end_datetime: datetime | None
    location: str
    banner_emoji: str | None
    banner_image_url: str | None = None  # resolved from key at service layer
    is_featured: bool
    agenda: dict | None
    speakers: list | None
    created_at: datetime


class EventSummaryResponse(AppModel):
    id: uuid.UUID
    title: str
    event_type: EventType
    status: EventStatus
    start_datetime: datetime
    location: str
    banner_emoji: str | None
    is_featured: bool


# ── Registrations ─────────────────────────────────────────────────────────────

class EventRegistrationRequest(AppModel):
    full_name: str = Field(min_length=2, max_length=255)
    level: int | None = Field(default=None, ge=100, le=600)
    contact: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class EventRegistrationResponse(AppModel):
    id: uuid.UUID
    event_id: uuid.UUID
    full_name: str
    level: int | None
    contact: str | None
    registered_at: datetime
