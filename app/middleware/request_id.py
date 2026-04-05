import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Attach a unique request ID to every request/response cycle.

    - Reads X-Request-ID from incoming headers (allows clients / API gateways
      to propagate their own trace IDs).
    - Generates a new UUID v4 if none is provided.
    - Binds it to the structlog context so every log line in the request
      automatically carries request_id.
    - Echoes it back in the response header.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())

        # Make it accessible on request.state for use in dependencies/services
        request.state.request_id = request_id

        # Bind to structlog context — all log lines within this request carry it
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
