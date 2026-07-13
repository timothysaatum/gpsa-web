from datetime import UTC, datetime

import structlog
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db

router = APIRouter(tags=["Health"])
logger = structlog.get_logger(__name__)


@router.get("/health", summary="Service health check")
async def health_check(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Returns the operational status of the API and its dependencies.
    Used by deployment pipelines and uptime monitors.
    """
    db_ok = False
    db_error: str | None = None

    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        db_error = str(exc)
        logger.error("health_check_db_failed", error=db_error)

    status_code = "ok" if db_ok else "degraded"

    return {
        "status": status_code,
        "app": settings.app_name,
        "version": "0.1.0",
        "environment": settings.environment,
        "timestamp": datetime.now(UTC).isoformat(),
        "dependencies": {
            "database": "ok" if db_ok else f"error: {db_error}",
        },
    }
