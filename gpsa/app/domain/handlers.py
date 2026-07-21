"""Domain event handlers — side effects triggered by business events.

Handlers are registered at application startup in ``main.py`` and are
invoked by the bus.  A failing handler never propagates the exception
(the bus catches and logs it).

Handlers that need I/O (DB, email, etc.) open their own short-lived
async session so they remain decoupled from the request scope.
"""

from __future__ import annotations

import structlog

from app.domain.bus import bus
from app.domain.events import (
    CertificateIssued,
    EmailVerified,
    EventCreated,
    FeedbackSubmitted,
    NewsPublished,
    OpportunityCreated,
    PasswordReset,
    RegistrationConfirmed,
    ReportResolved,
    ReportSubmitted,
    UserRegistered,
)
from app.domain.kernel import DomainEvent, DomainEventBus

logger = structlog.get_logger(__name__)


# ── Wildcard (logs everything) ─────────────────────────────────────────────────


def log_all_events(event: DomainEvent) -> None:
    logger.info(
        "domain_event",
        event_type=type(event).__name__,
        event_id=str(event.event_id),
        occurred_at=event.occurred_at.isoformat(),
    )


# ── Log handlers (fast, synchronous) ───────────────────────────────────────────


def on_user_registered(event: UserRegistered) -> None:
    logger.info(
        "user_registered_event", user_id=str(event.user_id), email=event.email, role=event.role
    )


def on_email_verified(event: EmailVerified) -> None:
    logger.info("email_verified_event", user_id=str(event.user_id))


def on_password_reset(event: PasswordReset) -> None:
    logger.info("password_reset_event", user_id=str(event.user_id))


def on_event_created(event: EventCreated) -> None:
    logger.info(
        "event_created_event",
        event_id=str(event.event_id),
        title=event.title,
        event_type=event.event_type,
    )


def on_feedback_submitted(event: FeedbackSubmitted) -> None:
    logger.info(
        "feedback_submitted_event",
        feedback_id=str(event.feedback_id),
        entity_type=event.entity_type,
        entity_id=str(event.entity_id),
        rating=event.rating,
    )


def on_report_submitted(event: ReportSubmitted) -> None:
    logger.info(
        "report_submitted_event",
        report_id=str(event.report_id),
        report_type=event.report_type,
        category=event.category,
    )


# ── Notification handlers (async, trigger in-app notifications) ────────────────


async def on_registration_confirmed(event: RegistrationConfirmed) -> None:
    logger.info(
        "registration_confirmed_event",
        registration_id=str(event.registration_id),
        event_id=str(event.event_id),
        user_id=str(event.user_id) if event.user_id else None,
        full_name=event.full_name,
    )
    if not event.user_id:
        return
    from app.db.session import AsyncSessionLocal
    from app.services.notification import NotificationService

    async with AsyncSessionLocal() as db:
        notifier = NotificationService(db)
        await notifier.event_registration_confirmed(event.user_id, event.event_id, "Event")


async def on_news_published(event: NewsPublished) -> None:
    logger.info(
        "news_published_event",
        post_id=str(event.post_id),
        title=event.title,
        category=event.category,
    )
    from sqlalchemy import select

    from app.db.session import AsyncSessionLocal
    from app.models.user import User
    from app.services.notification import NotificationService

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User.id).where(User.deleted_at.is_(None)))
        user_ids = list(result.scalars().all())
        notifier = NotificationService(db)
        for uid in user_ids:
            await notifier.news_published(uid, event.post_id, event.title)


async def on_opportunity_created(event: OpportunityCreated) -> None:
    logger.info(
        "opportunity_created_event",
        opportunity_id=str(event.opportunity_id),
        title=event.title,
    )
    from sqlalchemy import select

    from app.db.session import AsyncSessionLocal
    from app.models.user import User
    from app.services.notification import NotificationService

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User.id).where(User.deleted_at.is_(None)))
        user_ids = list(result.scalars().all())
        notifier = NotificationService(db)
        for uid in user_ids:
            await notifier.new_opportunity_posted(uid, event.opportunity_id, event.title)


async def on_report_resolved(event: ReportResolved) -> None:
    logger.info(
        "report_resolved_event",
        report_id=str(event.report_id),
        new_status=event.new_status,
    )
    from app.db.session import AsyncSessionLocal
    from app.models.welfare import WelfareReport
    from app.services.notification import NotificationService

    async with AsyncSessionLocal() as db:
        report = await db.get(WelfareReport, event.report_id)
        if report and report.contact and "@" in report.contact:
            notifier = NotificationService(db)
            await notifier.welfare_status_changed(report.id, report.id, event.new_status)


async def on_certificate_issued(event: CertificateIssued) -> None:
    logger.info(
        "certificate_issued_event",
        certificate_id=str(event.certificate_id),
        event_id=str(event.event_id),
        user_id=str(event.user_id),
    )
    from app.db.session import AsyncSessionLocal
    from app.models.event import Event
    from app.services.notification import NotificationService

    async with AsyncSessionLocal() as db:
        evt = await db.get(Event, event.event_id)
        title = evt.title if evt else "Event"
        notifier = NotificationService(db)
        await notifier.certificate_issued(event.user_id, event.certificate_id, title)


# ── Registration ───────────────────────────────────────────────────────────────


def register_event_handlers(event_bus: DomainEventBus = bus) -> None:
    """Register all domain event handlers.

    Call once at application startup (main.py lifespan).
    """
    event_bus.register_wildcard(log_all_events)
    event_bus.register(UserRegistered, on_user_registered)
    event_bus.register(EmailVerified, on_email_verified)
    event_bus.register(PasswordReset, on_password_reset)
    event_bus.register(EventCreated, on_event_created)
    event_bus.register(RegistrationConfirmed, on_registration_confirmed)
    event_bus.register(FeedbackSubmitted, on_feedback_submitted)
    event_bus.register(ReportSubmitted, on_report_submitted)
    event_bus.register(ReportResolved, on_report_resolved)
    event_bus.register(OpportunityCreated, on_opportunity_created)
    event_bus.register(CertificateIssued, on_certificate_issued)
    event_bus.register(NewsPublished, on_news_published)
