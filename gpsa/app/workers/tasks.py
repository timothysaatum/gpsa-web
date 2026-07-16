"""
Background tasks triggered by the APScheduler jobs defined in scheduler.py.

These are heavier operations that need DB + notification + email access,
kept separate from the scheduler itself to keep job registration clean.
"""

import structlog
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.event import Event, EventRegistration
from app.models.enums import EventStatus
from app.services.email import EmailService
from app.services.notification import NotificationService

logger = structlog.get_logger(__name__)


async def send_event_reminders(hours_before: int = 24) -> None:
    """
    Send reminder notifications + emails to all registered attendees
    for events starting in approximately `hours_before` hours.

    Called by the scheduler — runs daily so use a ±30 min window
    to avoid missing or double-sending.
    """
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    window_start = now + timedelta(hours=hours_before - 0.5)
    window_end = now + timedelta(hours=hours_before + 0.5)

    async with AsyncSessionLocal() as db:
        try:
            # Find upcoming events in the reminder window
            result = await db.execute(
                select(Event).where(
                    Event.start_datetime >= window_start,
                    Event.start_datetime <= window_end,
                    Event.status == EventStatus.upcoming,
                    Event.deleted_at.is_(None),
                )
            )
            events = result.scalars().all()

            for event in events:
                reg_result = await db.execute(
                    select(EventRegistration).where(
                        EventRegistration.event_id == event.id,
                        EventRegistration.deleted_at.is_(None),
                        EventRegistration.user_id.is_not(None),
                    )
                )
                registrations = reg_result.scalars().all()

                notif_svc = NotificationService(db)
                email_svc = EmailService(db)

                for reg in registrations:
                    if reg.user_id:
                        await notif_svc.event_reminder(
                            user_id=reg.user_id,
                            event_id=event.id,
                            event_title=event.title,
                            hours_until=hours_before,
                        )
                    # Email reminder if contact is an email address
                    if reg.contact and "@" in reg.contact:
                        await email_svc.send_event_registration_confirmation(
                            to=reg.contact,
                            full_name=reg.full_name,
                            event_title=event.title,
                            event_date=str(event.start_datetime.date()),
                            location=event.location,
                        )

                await db.commit()
                logger.info(
                    "event_reminders_sent",
                    event_id=str(event.id),
                    recipients=len(registrations),
                )
        except Exception:
            await db.rollback()
            logger.exception("send_event_reminders_failed")


async def notify_all_users_new_opportunity(opp_id: str, opp_title: str) -> None:
    """
    Broadcast a notification to all active, verified students
    when a new opportunity is published.

    Runs as a background task after opportunity creation — not inline
    in the request cycle, as the user list can be large.
    """
    import uuid as uuid_mod
    from sqlalchemy import and_

    from app.models.user import User
    from app.models.enums import UserRole

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(User).where(
                    User.email_verified.is_(True),
                    User.deleted_at.is_(None),
                    User.role == UserRole.student,
                )
            )
            users = result.scalars().all()
            notif_svc = NotificationService(db)
            opp_uuid = uuid_mod.UUID(opp_id)

            for user in users:
                await notif_svc.new_opportunity_posted(user.id, opp_uuid, opp_title)

            await db.commit()
            logger.info(
                "opportunity_notifications_sent",
                opp_id=opp_id,
                recipients=len(users),
            )
        except Exception:
            await db.rollback()
            logger.exception("notify_all_users_new_opportunity_failed")


async def retry_failed_emails(max_retries: int = 3) -> None:
    """
    Retry emails that failed to send, with exponential backoff.

    Backoff schedule: 5 min, 25 min, 2 hours (roughly).
    Emails that exhaust all retries are marked permanent_failure.
    """
    from datetime import UTC, datetime, timedelta

    from app.core.config import settings
    from app.models.email_log import EmailLog
    from app.models.enums import EmailStatus

    import resend

    resend.api_key = settings.resend_api_key

    async with AsyncSessionLocal() as db:
        try:
            now = datetime.now(UTC)
            result = await db.execute(
                select(EmailLog).where(
                    EmailLog.status == EmailStatus.failed,
                    EmailLog.retry_count < max_retries,
                ).order_by(EmailLog.created_at.asc())
            )
            failed_logs = result.scalars().all()

            for log in failed_logs:
                # Exponential backoff: 5 min, 25 min, 2 hours
                backoff_minutes = [5, 25, 120]
                if log.retry_count < len(backoff_minutes):
                    retry_delay = timedelta(minutes=backoff_minutes[log.retry_count])
                    if log.created_at + retry_delay > now:
                        continue

                try:
                    sender = f"{settings.email_from_name} <{settings.email_from_address}>"
                    resp = resend.Emails.send({
                        "from": sender,
                        "to": [log.recipient],
                        "subject": log.subject,
                        "html": log.html_body or "",
                    })
                    log.status = EmailStatus.sent
                    log.provider_message_id = resp.get("id")
                    log.sent_at = datetime.now(UTC)
                    log.error_message = None
                    logger.info("email_retry_succeeded", log_id=str(log.id), attempt=log.retry_count + 1)
                except Exception as exc:
                    log.retry_count += 1
                    log.error_message = str(exc)
                    if log.retry_count >= max_retries:
                        log.status = EmailStatus.permanent_failure
                        logger.warning("email_retry_exhausted", log_id=str(log.id))
                    else:
                        logger.info("email_retry_failed_will_retry", log_id=str(log.id), attempt=log.retry_count)

            await db.commit()
            if failed_logs:
                logger.info("email_retry_cycle_complete", processed=len(failed_logs))

        except Exception:
            await db.rollback()
            logger.exception("retry_failed_emails_failed")
