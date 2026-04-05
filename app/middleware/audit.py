import time

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger(__name__)

# Paths that generate too much noise to log at INFO level
_SKIP_LOGGING = {"/api/v1/health", "/favicon.ico", "/docs", "/redoc", "/openapi.json"}


class AuditContextMiddleware(BaseHTTPMiddleware):
    """
    Populate request.state with the context fields that the audit service
    needs to write an AuditLog row:

        request.state.ip_address   — real client IP (honours X-Forwarded-For)
        request.state.user_agent   — raw User-Agent header
        request.state.request_id   — set by RequestIDMiddleware (runs first)

    Also emits a structured access log line after every response
    with method, path, status, and duration.

    NOTE: actor_id is NOT set here — it is injected by the
    get_current_user dependency after JWT verification.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # ── Client IP ─────────────────────────────────────────────────────────
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first (original) address from a proxy chain
            ip_address = forwarded_for.split(",")[0].strip()
        else:
            ip_address = request.client.host if request.client else "unknown"

        request.state.ip_address = ip_address
        request.state.user_agent = request.headers.get("User-Agent", "")

        # ── Timing ────────────────────────────────────────────────────────────
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        # ── Access log ────────────────────────────────────────────────────────
        if request.url.path not in _SKIP_LOGGING:
            log = logger.bind(
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=duration_ms,
                ip=ip_address,
            )
            if response.status_code >= 500:
                log.error("request_error")
            elif response.status_code >= 400:
                log.warning("request_warning")
            else:
                log.info("request_ok")

        return response
