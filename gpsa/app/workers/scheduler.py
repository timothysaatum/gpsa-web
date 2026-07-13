"""
APScheduler setup for background jobs.

Jobs registered here:
  1. expire_opportunities   — daily at midnight, marks past-deadline opps inactive
  2. prune_notifications    — weekly, hard-deletes notifications older than 90 days
  3. update_event_statuses  — hourly, transitions event status to 'ongoing' / 'past'

The scheduler is started and shut down via the FastAPI lifespan context manager
in main.py — it is never started independently.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

import structlog

logger = structlog.get_logger(__name__)

scheduler = AsyncIOScheduler(timezone="Africa/Accra")


# ── Job definitions ───────────────────────────────────────────────────────────

async def expire_opportunities() -> None:
    """Set is_active=False on opportunities whose deadline has passed."""
    from datetime import date

    from sqlalchemy import update

    from app.db.session import AsyncSessionLocal
    from app.models.opportunity import Opportunity

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                update(Opportunity)
                .where(
                    Opportunity.deadline < date.today(),
                    Opportunity.is_active.is_(True),
                    Opportunity.deleted_at.is_(None),
                )
                .values(is_active=False)
            )
            await db.commit()
            logger.info("opportunities_expired", count=result.rowcount)
        except Exception:
            await db.rollback()
            logger.exception("expire_opportunities_failed")


async def update_event_statuses() -> None:
    """Transition events from upcoming → ongoing → past based on datetime."""
    from datetime import UTC, datetime

    from sqlalchemy import update

    from app.db.session import AsyncSessionLocal
    from app.models.event import Event
    from app.models.enums import EventStatus

    now = datetime.now(UTC)

    async with AsyncSessionLocal() as db:
        try:
            # upcoming → ongoing
            await db.execute(
                update(Event)
                .where(
                    Event.start_datetime <= now,
                    Event.end_datetime > now,
                    Event.status == EventStatus.upcoming,
                    Event.deleted_at.is_(None),
                )
                .values(status=EventStatus.ongoing)
            )
            # ongoing / upcoming → past
            await db.execute(
                update(Event)
                .where(
                    Event.end_datetime <= now,
                    Event.status.in_([EventStatus.upcoming, EventStatus.ongoing]),
                    Event.deleted_at.is_(None),
                )
                .values(status=EventStatus.past)
            )
            await db.commit()
            logger.info("event_statuses_updated")
        except Exception:
            await db.rollback()
            logger.exception("update_event_statuses_failed")


async def prune_old_notifications() -> None:
    """Hard-delete notifications older than 90 days."""
    from datetime import UTC, datetime, timedelta

    from sqlalchemy import delete

    from app.db.session import AsyncSessionLocal
    from app.models.notification import Notification

    cutoff = datetime.now(UTC) - timedelta(days=90)

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                delete(Notification).where(Notification.created_at < cutoff)
            )
            await db.commit()
            logger.info("notifications_pruned", count=result.rowcount)
        except Exception:
            await db.rollback()
            logger.exception("prune_notifications_failed")


# ── Registration ──────────────────────────────────────────────────────────────

def register_jobs() -> None:
    from app.workers.tasks import send_event_reminders

    scheduler.add_job(
        expire_opportunities,
        trigger=CronTrigger(hour=0, minute=5, timezone="Africa/Accra"),
        id="expire_opportunities",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    scheduler.add_job(
        update_event_statuses,
        trigger=IntervalTrigger(hours=1),
        id="update_event_statuses",
        replace_existing=True,
        misfire_grace_time=600,
    )
    scheduler.add_job(
        prune_old_notifications,
        trigger=CronTrigger(day_of_week="sun", hour=2, timezone="Africa/Accra"),
        id="prune_old_notifications",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    # 24-hour event reminder — runs daily at 8am
    scheduler.add_job(
        lambda: __import__("asyncio").get_event_loop().run_until_complete(
            send_event_reminders(hours_before=24)
        ),
        trigger=CronTrigger(hour=8, minute=0, timezone="Africa/Accra"),
        id="event_reminders_24h",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    logger.info("scheduler_jobs_registered", job_count=len(scheduler.get_jobs()))
