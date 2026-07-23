import logging
import sys
from typing import Any

import structlog
from structlog.types import EventDict, WrappedLogger

from app.core.config import settings


def _add_app_context(
    logger: WrappedLogger,
    method_name: str,
    event_dict: EventDict,
) -> EventDict:
    """Inject static app context into every log line."""
    event_dict["app"] = settings.app_name
    event_dict["env"] = settings.environment
    return event_dict


def _drop_color_message_key(
    logger: WrappedLogger,
    method_name: str,
    event_dict: EventDict,
) -> EventDict:
    """Uvicorn emits a 'color_message' key — drop it for clean JSON logs."""
    event_dict.pop("color_message", None)
    return event_dict


def configure_logging() -> None:
    """
    Configure structlog for the application.

    - Development: human-readable console output with colours.
    - Production: machine-parseable JSON output.
    """
    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        _add_app_context,
        _drop_color_message_key,
        structlog.processors.StackInfoRenderer(),
    ]

    # Use proper stdlib integration so add_logger_name works everywhere
    # (scripts, alembic, tests, uvicorn, etc.)
    if settings.is_development:
        processors = [
            *shared_processors,
            structlog.stdlib.add_logger_name,          # Now safe
            structlog.dev.ConsoleRenderer(colors=True),
        ]
    else:
        processors = [
            *shared_processors,
            structlog.stdlib.add_logger_name,
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]

    structlog.configure(
        processors=processors,  # type: ignore[arg-type]
        wrapper_class=structlog.stdlib.BoundLogger,      # ← Key fix
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(), # ← Key fix
        cache_logger_on_first_use=True,
    )

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if settings.debug else logging.INFO,
        force=True,                     # Important for scripts & alembic
    )

    # Quieten noisy libraries
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.debug else logging.WARNING
    )
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Return a properly configured logger."""
    return structlog.get_logger(name)
