import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.db.session import get_db
from app.models.notification import Notification
from app.repositories.base import BaseRepository
from app.schemas.common import AppModel, MessageResponse, PaginatedResponse

router = APIRouter(tags=["Notifications"])


# ── Schema ────────────────────────────────────────────────────────────────────

class NotificationResponse(AppModel):
    id: uuid.UUID
    notification_type: str
    title: str
    body: str
    link: str | None
    is_read: bool
    created_at: datetime


# ── Repository ────────────────────────────────────────────────────────────────

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Notification, db)

    async def list_for_user(
        self, user_id: uuid.UUID, *, unread_only: bool = False, offset: int = 0, limit: int = 30
    ) -> list[Notification]:
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.is_read.is_(False))
        q = q.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def unread_count(self, user_id: uuid.UUID) -> int:
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        return result.scalar_one()

    async def mark_all_read(self, user_id: uuid.UUID) -> int:
        now = datetime.now(UTC)
        result = await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .values(is_read=True, read_at=now)
        )
        await self.db.flush()
        return result.rowcount


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=PaginatedResponse[NotificationResponse],
    summary="Get my notifications",
)
async def list_notifications(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    unread_only: bool = False,
    offset: int = 0,
    limit: int = 30,
) -> PaginatedResponse[NotificationResponse]:
    repo = NotificationRepository(db)
    notifs = await repo.list_for_user(
        current_user.id, unread_only=unread_only, offset=offset, limit=limit
    )
    total = await repo.unread_count(current_user.id)
    return PaginatedResponse(
        items=[NotificationResponse.model_validate(n) for n in notifs],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post(
    "/{notif_id}/read",
    response_model=NotificationResponse,
    summary="Mark a notification as read",
)
async def mark_read(
    notif_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NotificationResponse:
    repo = NotificationRepository(db)
    notif = await repo.get_by_id_or_404(notif_id)
    if notif.user_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not your notification.")
    notif = await repo.update(notif, {"is_read": True, "read_at": datetime.now(UTC)})
    await db.commit()
    await db.refresh(notif)
    return NotificationResponse.model_validate(notif)


@router.post(
    "/read-all",
    response_model=MessageResponse,
    summary="Mark all notifications as read",
)
async def mark_all_read(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    count = await NotificationRepository(db).mark_all_read(current_user.id)
    await db.commit()
    return MessageResponse(message=f"{count} notification(s) marked as read.")
