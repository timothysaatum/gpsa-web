from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.workers.scheduler import register_jobs, scheduler

# Configure structured logging before anything else runs
configure_logging()

logger = structlog.get_logger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Manage startup and shutdown of long-lived resources.

    Startup:
      - Verify DB connectivity
      - Register and start background scheduler

    Shutdown:
      - Gracefully shut down scheduler
      - Dispose DB connection pool
    """
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("startup_begin", app=settings.app_name, env=settings.environment)

    # Verify database is reachable before accepting traffic
    from sqlalchemy import text
    from app.db.session import AsyncSessionLocal, engine

    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        logger.info("database_connected")
    except Exception as exc:
        logger.critical("database_connection_failed", error=str(exc))
        raise

    # Start background scheduler
    register_jobs()
    scheduler.start()
    logger.info("scheduler_started")

    logger.info("startup_complete")

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("shutdown_begin")

    scheduler.shutdown(wait=False)
    logger.info("scheduler_stopped")

    await engine.dispose()
    logger.info("db_pool_disposed")

    logger.info("shutdown_complete")


# ── Application factory ───────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        description=(
            "Official REST API for the Ghana Pharmaceutical Students' Association "
            "— University for Development Studies (GPSA-UDS) departmental website."
        ),
        version="0.1.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    _register_middleware(app)
    _register_routers(app)
    _register_exception_handlers(app)

    return app


# ── Middleware stack ──────────────────────────────────────────────────────────
# Order matters — outermost middleware runs first on request, last on response.

def _register_middleware(app: FastAPI) -> None:
    from app.middleware.request_id import RequestIDMiddleware
    from app.middleware.audit import AuditContextMiddleware
    from app.middleware.rate_limit import RateLimitMiddleware

    # 1. CORS — must be outermost to handle preflight before auth
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    # 2. Request ID — attach before any logging happens
    app.add_middleware(RequestIDMiddleware)

    # 3. Audit context — IP, user-agent, access log
    app.add_middleware(AuditContextMiddleware)

    # 4. Rate limiting — applied after IP is resolved by AuditContextMiddleware
    app.add_middleware(RateLimitMiddleware)


# ── Routers ───────────────────────────────────────────────────────────────────

def _register_routers(app: FastAPI) -> None:
    app.include_router(api_router, prefix=settings.api_v1_prefix)


# ── Exception handlers ────────────────────────────────────────────────────────

def _register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """
        Return a clean, structured 422 response instead of FastAPI's default.
        Field errors are flattened into a list of {field, message} objects.
        """
        errors = [
            {
                "field": ".".join(str(loc) for loc in err["loc"] if loc != "body"),
                "message": err["msg"],
                "type": err["type"],
            }
            for err in exc.errors()
        ]
        logger.warning(
            "validation_error",
            path=request.url.path,
            errors=errors,
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": "Validation failed", "errors": errors},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """
        Catch-all for unhandled exceptions.
        Logs the full traceback but returns a sanitised message to clients.
        Never expose internal error details in production.
        """
        request_id = getattr(request.state, "request_id", "unknown")
        logger.exception(
            "unhandled_exception",
            path=request.url.path,
            method=request.method,
            request_id=request_id,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An unexpected error occurred. Please try again later.",
                "request_id": request_id,
            },
        )


# ── Entry point ───────────────────────────────────────────────────────────────

app = create_app()
