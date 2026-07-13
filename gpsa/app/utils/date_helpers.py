"""
Date/time utilities used across services and background jobs.
All datetimes are timezone-aware UTC internally; format for display only at response layer.
"""

from datetime import UTC, date, datetime, timedelta


def now_utc() -> datetime:
    return datetime.now(UTC)


def days_until(target: date) -> int:
    """Number of calendar days from today until target date. Negative if in the past."""
    return (target - date.today()).days


def deadline_urgency(deadline: date) -> str:
    """
    Return a human-readable urgency label for an opportunity deadline.
    Used to drive the urgency badge on the frontend.
    """
    days = days_until(deadline)
    if days < 0:
        return "expired"
    if days == 0:
        return "closing_today"
    if days <= 7:
        return "closing_soon"
    return "open"


def event_urgency(start: datetime) -> str:
    """
    Return an urgency label for an upcoming event.
    Mirrors the frontend badge logic (Today / Tomorrow / This Week).
    """
    now = now_utc()
    delta = start - now

    if delta.total_seconds() < 0:
        return "past"
    if delta.total_seconds() < 3600 * 24:
        return "today"
    if delta.total_seconds() < 3600 * 48:
        return "tomorrow"
    if delta.total_seconds() < 3600 * 24 * 7:
        return "this_week"
    return "upcoming"


def add_hours(dt: datetime, hours: int) -> datetime:
    return dt + timedelta(hours=hours)


def add_days(dt: datetime, days: int) -> datetime:
    return dt + timedelta(days=days)
