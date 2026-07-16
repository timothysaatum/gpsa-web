"""Domain event bus singleton — importable by both services and startup code."""

from app.domain.kernel import DomainEventBus

bus = DomainEventBus()
