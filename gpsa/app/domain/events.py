"""Domain event definitions — one frozen dataclass per meaningful business event."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from .kernel import DomainEvent


# ── Auth ───────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class UserRegistered(DomainEvent):
    user_id: uuid.UUID
    email: str
    role: str


@dataclass(frozen=True)
class EmailVerified(DomainEvent):
    user_id: uuid.UUID


@dataclass(frozen=True)
class PasswordReset(DomainEvent):
    user_id: uuid.UUID


# ── Events ─────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class EventCreated(DomainEvent):
    event_id: uuid.UUID
    title: str
    event_type: str


@dataclass(frozen=True)
class EventPublished(DomainEvent):
    event_id: uuid.UUID
    title: str


@dataclass(frozen=True)
class RegistrationConfirmed(DomainEvent):
    registration_id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID | None
    full_name: str


# ── Feedback ───────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class FeedbackSubmitted(DomainEvent):
    feedback_id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    rating: int


# ── Welfare ────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class ReportSubmitted(DomainEvent):
    report_id: uuid.UUID
    report_type: str
    category: str


@dataclass(frozen=True)
class ReportResolved(DomainEvent):
    report_id: uuid.UUID
    new_status: str


# ── Opportunities ──────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class OpportunityCreated(DomainEvent):
    opportunity_id: uuid.UUID
    title: str


# ── Certificates ───────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class CertificateIssued(DomainEvent):
    certificate_id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID


# ── News ───────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class NewsPublished(DomainEvent):
    post_id: uuid.UUID
    title: str
    category: str
