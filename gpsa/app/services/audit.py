"""
Audit service — the single point through which every mutation
is recorded in audit_logs.

Usage (inside any service method):
    await AuditService(db).log(
        action="CREATE",
        entity_type="event",
        entity_id=event.id,
        new_values={"title": event.title, "status": event.status},
        request=request,          # FastAPI Request — optional but preferred
        actor_id=current_user.id, # optional if request.state.actor_id is set
    )

Rules:
  - Never raises — audit failures must not block the primary operation.
    Errors are logged but swallowed.
  - actor_id resolution priority:
      1. explicit actor_id argument
      2. request.state.actor_id (set by get_current_user dependency)
      3. None (system / background job action)
"""

import uuid
from typing import Any

import structlog
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog

logger = structlog.get_logger(__name__)


class AuditService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def log(
        self,
        *,
        action: str,
        entity_type: str,
        entity_id: uuid.UUID | None = None,
        old_values: dict[str, Any] | None = None,
        new_values: dict[str, Any] | None = None,
        request: Request | None = None,
        actor_id: uuid.UUID | None = None,
    ) -> None:
        try:
            resolved_actor_id = actor_id
            ip_address: str | None = None
            user_agent: str | None = None
            request_id: str | None = None

            if request is not None:
                if resolved_actor_id is None:
                    resolved_actor_id = getattr(request.state, "actor_id", None)
                ip_address = getattr(request.state, "ip_address", None)
                user_agent = getattr(request.state, "user_agent", None)
                request_id = getattr(request.state, "request_id", None)

            entry = AuditLog(
                actor_id=resolved_actor_id,
                action=action.upper(),
                entity_type=entity_type,
                entity_id=entity_id,
                old_values=old_values,
                new_values=new_values,
                ip_address=ip_address,
                user_agent=user_agent,
                request_id=request_id,
            )
            self.db.add(entry)
            await self.db.flush()

        except Exception:
            # Audit failure must never crash the primary operation
            logger.exception(
                "audit_log_failed",
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id else None,
            )
