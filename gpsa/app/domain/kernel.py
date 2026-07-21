"""Domain kernel — base primitives for domain-driven design.

Provides:
  * ValueObject — structural-equality base for immutable value objects
  * Entity — protocol for objects with a persistent identity
  * AggregateRoot — entity that records domain events
  * DomainEvent — frozen dataclass base
  * DomainEventBus — simple in-process pub/sub dispatcher
"""

from __future__ import annotations

import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Protocol


class Entity(Protocol):
    """Protocol for domain entities (anything with an identity)."""

    id: uuid.UUID


@dataclass(frozen=True, kw_only=True)
class DomainEvent:
    """Base class for all domain events.

    Every event carries a unique id and a UTC timestamp so that
    event-sourced projections and audit trails remain deterministic.

    ``kw_only=True`` lets child dataclasses add required (positional)
    fields without clashing with the optional base fields.
    """

    event_id: uuid.UUID = field(default_factory=uuid.uuid4)
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class ValueObject:
    """Base class for immutable value objects with structural equality."""

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self.__dict__ == other.__dict__

    def __hash__(self) -> int:
        return hash(tuple(sorted(self.__dict__.items())))


EventHandler = Callable[[DomainEvent], Any]


class DomainEventBus:
    """Simple in-process domain event bus.

    Handlers are invoked synchronously in registration order. A failing
    handler never propagates the exception — failures are logged and the
    next handler runs. This guarantees that event publishing never breaks
    the caller.
    """

    def __init__(self) -> None:
        self._handlers: dict[type[DomainEvent], list[EventHandler]] = {}
        self._wildcards: list[EventHandler] = []

    def register(self, event_type: type[DomainEvent], handler: EventHandler) -> None:
        self._handlers.setdefault(event_type, []).append(handler)

    def register_wildcard(self, handler: EventHandler) -> None:
        self._wildcards.append(handler)

    def publish(self, event: DomainEvent) -> None:
        import logging

        for handler in self._handlers.get(type(event), []):
            try:
                handler(event)
            except Exception:
                logging.getLogger(__name__).exception(
                    "Domain event handler failed",
                    extra={"event_type": type(event).__name__, "event_id": str(event.event_id)},
                )
        for handler in self._wildcards:
            try:
                handler(event)
            except Exception:
                logging.getLogger(__name__).exception(
                    "Wildcard handler failed",
                    extra={"event_type": type(event).__name__, "event_id": str(event.event_id)},
                )

    async def publish_async(self, event: DomainEvent) -> None:
        """Async variant of ``publish`` — transparently awaits coroutine handlers."""
        import asyncio
        import logging

        for handler in self._handlers.get(type(event), []):
            try:
                result = handler(event)
                if asyncio.iscoroutine(result):
                    await result
            except Exception:
                logging.getLogger(__name__).exception(
                    "Domain event handler failed",
                    extra={"event_type": type(event).__name__, "event_id": str(event.event_id)},
                )
        for handler in self._wildcards:
            try:
                result = handler(event)
                if asyncio.iscoroutine(result):
                    await result
            except Exception:
                logging.getLogger(__name__).exception(
                    "Wildcard handler failed",
                    extra={"event_type": type(event).__name__, "event_id": str(event.event_id)},
                )

    def publish_all(self, events: list[DomainEvent]) -> None:
        for event in events:
            self.publish(event)
