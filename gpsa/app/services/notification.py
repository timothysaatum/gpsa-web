"""
Notification service — creates in-app notification rows.

Called by other services after significant events:
  - Event registration confirmed
  - Welfare report status changed
  - New opportunity posted
  - New news post published
  - Certificate issued

Never raises — notification failures must not block primary operations.
"""

import uuid

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import NotificationType
from app.models.notification import Notification

logger = structlog.get_logger(__name__)


class NotificationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _create(
        self,
        *,
        user_id: uuid.UUID,
        notification_type: NotificationType,
        title: str,
        body: str,
        link: str | None = None,
        entity_type: str | None = None,
        entity_id: uuid.UUID | None = None,
    ) -> None:
        try:
            notif = Notification(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                body=body,
                link=link,
                entity_type=entity_type,
                entity_id=entity_id,
            )
            self.db.add(notif)
            await self.db.flush()
        except Exception:
            logger.exception(
                "notification_create_failed",
                user_id=str(user_id),
                type=notification_type,
            )

    # ── Domain-specific helpers ───────────────────────────────────────────────

    async def event_registration_confirmed(
        self, user_id: uuid.UUID, event_id: uuid.UUID, event_title: str
    ) -> None:
        await self._create(
            user_id=user_id,
            notification_type=NotificationType.event_registration,
            title="Registration confirmed",
            body=f"You are registered for {event_title!r}.",
            link=f"/events/{event_id}",
            entity_type="event",
            entity_id=event_id,
        )

    async def welfare_status_changed(
        self,
        user_id: uuid.UUID,
        report_id: uuid.UUID,
        new_status: str,
    ) -> None:
        await self._create(
            user_id=user_id,
            notification_type=NotificationType.welfare_status_change,
            title="PharmaCare report updated",
            body=f"Your report status has changed to {new_status.replace('_', ' ').title()}.",
            link="/welfare",
            entity_type="welfare_report",
            entity_id=report_id,
        )

    async def new_opportunity_posted(
        self, user_id: uuid.UUID, opp_id: uuid.UUID, opp_title: str
    ) -> None:
        await self._create(
            user_id=user_id,
            notification_type=NotificationType.opportunity_posted,
            title="New opportunity available",
            body=f"A new opportunity has been posted: {opp_title!r}.",
            link=f"/opportunities/{opp_id}",
            entity_type="opportunity",
            entity_id=opp_id,
        )

    async def news_published(self, user_id: uuid.UUID, post_id: uuid.UUID, post_title: str) -> None:
        await self._create(
            user_id=user_id,
            notification_type=NotificationType.news_published,
            title="New announcement",
            body=post_title,
            link=f"/news/{post_id}",
            entity_type="news_post",
            entity_id=post_id,
        )

    async def certificate_issued(
        self, user_id: uuid.UUID, cert_id: uuid.UUID, event_title: str
    ) -> None:
        await self._create(
            user_id=user_id,
            notification_type=NotificationType.general,
            title="Certificate issued",
            body=f"Your certificate for {event_title!r} is ready to download.",
            link=f"/certificates/{cert_id}",
            entity_type="certificate",
            entity_id=cert_id,
        )

    async def event_reminder(
        self, user_id: uuid.UUID, event_id: uuid.UUID, event_title: str, hours_until: int
    ) -> None:
        await self._create(
            user_id=user_id,
            notification_type=NotificationType.event_reminder,
            title="Event reminder",
            body=f"{event_title!r} starts in {hours_until} hour(s).",
            link=f"/events/{event_id}",
            entity_type="event",
            entity_id=event_id,
        )
