import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import AppModel, MessageResponse


class HeroStatSchema(AppModel):
    label: str
    value: str
    icon_name: str | None = None


class LeaderSummarySchema(AppModel):
    id: uuid.UUID | None = None
    full_name: str
    office: str
    photo_url: str | None = None


class AdministrationLeaderGroupSchema(AppModel):
    president: LeaderSummarySchema | None = None
    vice_president: LeaderSummarySchema | None = None
    other_executives_count: int = 0
    other_executives: list[LeaderSummarySchema] = []


class AdministrationAchievementSchema(AppModel):
    id: uuid.UUID
    title: str
    summary: str
    category: str | None = None
    image_url: str | None = None


class AdministrationResponse(AppModel):
    id: uuid.UUID
    academic_year: str
    slug: str
    title: str
    theme: str | None = None
    slogan: str | None = None
    starts_at: date | None = None
    ends_at: date | None = None
    group_photo_url: str | None = None
    group_photo_alt: str | None = None
    is_current: bool = False
    status: str = "published"
    summary: str | None = None
    executive_count: int = 0
    committee_count: int = 0
    initiatives_count: int = 0
    lives_impacted: str | None = "5,600+"
    display_order: int = 0
    top_leadership: AdministrationLeaderGroupSchema = AdministrationLeaderGroupSchema()
    achievements: list[AdministrationAchievementSchema] = []


class TimelineEventResponse(AppModel):
    id: uuid.UUID
    year_label: str
    event_date: date | None = None
    title: str
    summary: str
    icon_name: str | None = None
    verification_status: str = "verified"
    status: str = "published"
    display_order: int = 0


class RecognitionCategoryResponse(AppModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str
    icon_name: str | None = None
    honourees_count: int = 0


class RecognitionHonoureeResponse(AppModel):
    id: uuid.UUID
    category_id: uuid.UUID
    full_name: str
    title: str
    citation: str | None = None
    recognition_year: str | None = None
    class_year: str | None = None
    photo_url: str | None = None
    photo_alt: str | None = None


class LegacyAwardResponse(AppModel):
    id: uuid.UUID
    title: str
    slug: str
    award_year: str
    category: str
    recipient_type: str
    recipient_name: str | None = None
    citation: str
    image_url: str | None = None
    image_alt: str | None = None
    is_featured: bool = True
    display_order: int = 0


class LegacyPageResponse(AppModel):
    hero_eyebrow: str = "PAST LEADERSHIP & RECOGNITION"
    hero_headline_primary: str = "Leadership remembered."
    hero_headline_secondary: str = "Excellence recognised."
    hero_supporting_text: str = (
        "Honouring the leaders, champions and achievers who have shaped GPSA-UDS and advanced the profession of pharmacy."
    )
    hero_quote_text: str = "Good leadership isn't about position. It's about purpose, service and impact."
    hero_quote_citation: str = "Once Pharmily, Always Pharmily."
    statistics: list[HeroStatSchema] = []
    administrations: list[AdministrationResponse] = []
    selected_administration: AdministrationResponse | None = None
    timeline: list[TimelineEventResponse] = []
    recognition_categories: list[RecognitionCategoryResponse] = []
    featured_awards: list[LegacyAwardResponse] = []


class HistoricalRecordSubmissionRequest(AppModel):
    submitter_name: str = Field(..., min_length=2, max_length=255)
    submitter_email: EmailStr
    submitter_phone: str | None = Field(None, max_length=50)
    relationship_to_gpsa: str | None = Field(None, max_length=100)
    record_type: str = Field(..., max_length=100)
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    administration_year: str | None = Field(None, max_length=20)
    event_date: date | None = None
    consent_to_archive: bool
    consent_to_publish: bool = False

    @field_validator("consent_to_archive")
    @classmethod
    def archive_consent_must_be_given(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Consent to archive the submitted record is required.")
        return value


class HistoricalRecordSubmissionCreated(MessageResponse):
    id: uuid.UUID


class LeaderNominationRequest(AppModel):
    nominee_name: str = Field(..., min_length=2, max_length=255)
    nominee_email: EmailStr | None = None
    category_id: uuid.UUID | None = None
    administration_year: str | None = Field(None, max_length=20)
    reason: str = Field(..., min_length=10)
    achievements: str | None = None
    nominator_name: str = Field(..., min_length=2, max_length=255)
    nominator_email: EmailStr
    relationship_to_nominee: str | None = Field(None, max_length=100)
    consent_confirmed: bool

    @field_validator("consent_confirmed")
    @classmethod
    def nomination_consent_must_be_given(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Confirmation that the information is accurate is required.")
        return value


class SubmissionReviewRequest(AppModel):
    status: Literal["accepted", "rejected", "published", "archived"]
    review_notes: str | None = None


class NominationReviewRequest(AppModel):
    status: Literal["approved", "rejected", "under_review"]
    review_notes: str | None = None
