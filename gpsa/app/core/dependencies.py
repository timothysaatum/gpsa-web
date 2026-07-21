import uuid
from typing import Annotated

import jwt
import structlog
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User

logger = structlog.get_logger(__name__)

_bearer = HTTPBearer(auto_error=False)

# ── Token extraction ──────────────────────────────────────────────────────────


async def _get_token_payload(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    return payload


# ── User resolution ───────────────────────────────────────────────────────────


async def get_current_user(
    request: Request,
    payload: Annotated[dict, Depends(_get_token_payload)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Resolve the authenticated user from the JWT payload.
    Also binds actor_id to structlog context and request.state
    so the audit service can pick it up without being passed explicitly.
    """
    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject"
        )

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token subject"
        )

    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not verified. Check your inbox.",
        )

    # Bind actor context for audit logging and structured logs
    request.state.actor_id = user.id
    structlog.contextvars.bind_contextvars(actor_id=str(user.id), role=user.role)

    return user


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Annotated[AsyncSession, Depends(get_db)],
    request: Request,
) -> User | None:
    """
    Like get_current_user but returns None instead of raising
    for unauthenticated requests. Use on endpoints that serve
    both public and authenticated traffic differently.
    """
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            return None
        user_id = uuid.UUID(payload["sub"])
    except Exception:
        return None

    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if user:
        request.state.actor_id = user.id
        structlog.contextvars.bind_contextvars(actor_id=str(user.id), role=user.role)
    return user


# ── Role guards ───────────────────────────────────────────────────────────────

CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]


def require_roles(*roles: UserRole):
    """
    Dependency factory — restrict an endpoint to one or more roles.

    Usage:
        @router.post("/admin/thing")
        async def create_thing(
            user: Annotated[User, Depends(require_roles(UserRole.admin, UserRole.exec))]
        ): ...
    """

    async def _check(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return user

    return _check


# Convenience aliases
RequireAdmin = Depends(require_roles(UserRole.admin))
RequireExecOrAdmin = Depends(require_roles(UserRole.exec, UserRole.admin))
