import structlog
from fastapi import APIRouter, Depends
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.academic_resource import AcademicResourceRepository
from app.repositories.event import EventRepository
from app.repositories.user import UserRepository

router = APIRouter(tags=["Stats"])
logger = structlog.get_logger(__name__)


async def _safe_count(coro) -> int:
    try:
        return await coro
    except SQLAlchemyError:
        return 0


@router.get("/stats", summary="Site-wide aggregate statistics")
async def get_stats(db: AsyncSession = Depends(get_db)) -> dict:
    users = UserRepository(db)
    events = EventRepository(db)
    resources = AcademicResourceRepository(db)

    total_users = await _safe_count(users.count())
    active_members = await _safe_count(users.count_verified())
    total_resources = await _safe_count(resources.count_filtered(published_only=True))
    total_events = await _safe_count(events.count_filtered())

    return {
        "total_users": total_users,
        "active_members": active_members,
        "total_events": total_events,
        "total_resources": total_resources,
    }
