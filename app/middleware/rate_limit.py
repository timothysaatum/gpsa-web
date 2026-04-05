"""
Lightweight in-process rate limiter for the login endpoint.

For multi-instance deployments, replace the in-memory store with
a Redis backend (e.g. via `redis.asyncio`).

Current behaviour:
  - Tracks failed attempts per IP address (key = "ip:{ip}")
  - Tracks failed attempts per email (key = "email:{email}") — set by auth service
  - After MAX_LOGIN_ATTEMPTS failures, blocks for LOCKOUT_DURATION_MINUTES
  - Only applied to POST /api/v1/auth/login
"""

import time
from collections import defaultdict
from dataclasses import dataclass, field

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import settings

logger = structlog.get_logger(__name__)

_LOGIN_PATH = f"{settings.api_v1_prefix}/auth/login"


@dataclass
class _AttemptBucket:
    count: int = 0
    locked_until: float = 0.0
    window_start: float = field(default_factory=time.monotonic)


# In-memory store — replace with Redis for multi-instance
_store: dict[str, _AttemptBucket] = defaultdict(_AttemptBucket)
_WINDOW_SECONDS = settings.lockout_duration_minutes * 60


def _bucket_key(request: Request) -> str:
    ip = getattr(request.state, "ip_address", request.client.host if request.client else "unknown")
    return f"ip:{ip}"


def is_rate_limited(key: str) -> bool:
    bucket = _store[key]
    now = time.monotonic()
    if bucket.locked_until and now < bucket.locked_until:
        return True
    # Reset window after lockout expires
    if now - bucket.window_start > _WINDOW_SECONDS:
        _store[key] = _AttemptBucket()
    return False


def record_failed_attempt(key: str) -> None:
    bucket = _store[key]
    bucket.count += 1
    if bucket.count >= settings.max_login_attempts:
        bucket.locked_until = time.monotonic() + _WINDOW_SECONDS
        logger.warning("rate_limit_lockout", key=key, attempts=bucket.count)


def reset_attempts(key: str) -> None:
    """Call this on successful login to clear the counter."""
    _store.pop(key, None)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Block repeated login attempts from the same IP."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method == "POST" and request.url.path == _LOGIN_PATH:
            key = _bucket_key(request)
            if is_rate_limited(key):
                logger.warning(
                    "rate_limit_blocked",
                    ip=getattr(request.state, "ip_address", "unknown"),
                    path=request.url.path,
                )
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": (
                            f"Too many failed login attempts. "
                            f"Try again in {settings.lockout_duration_minutes} minutes."
                        )
                    },
                )
        return await call_next(request)
