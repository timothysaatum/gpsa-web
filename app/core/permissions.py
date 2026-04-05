"""
Centralised permission definitions.

Rather than scattering role checks across route files, every
"can X do Y?" question is answered here. Services call these
helpers; routes use the dependency guards from dependencies.py.

Design principle: explicit > implicit.
If a permission is not listed, it is denied.
"""

from app.models.enums import UserRole
from app.models.user import User


# ── Academic Resources ────────────────────────────────────────────────────────

def can_upload_resource(user: User) -> bool:
    """Exec and admin can upload; students cannot."""
    return user.role in (UserRole.exec, UserRole.admin)


def can_publish_resource(user: User) -> bool:
    """Only admin can approve and publish uploaded resources."""
    return user.role == UserRole.admin


# ── Events ────────────────────────────────────────────────────────────────────

def can_create_event(user: User) -> bool:
    return user.role in (UserRole.exec, UserRole.admin)


def can_publish_event(user: User) -> bool:
    return user.role == UserRole.admin


def can_issue_certificates(user: User) -> bool:
    return user.role in (UserRole.exec, UserRole.admin)


# ── Welfare ───────────────────────────────────────────────────────────────────

def can_view_welfare_reports(user: User) -> bool:
    """Only exec and admin see the full report list."""
    return user.role in (UserRole.exec, UserRole.admin)


def can_resolve_welfare_report(user: User) -> bool:
    return user.role in (UserRole.exec, UserRole.admin)


def can_manage_spotlight(user: User) -> bool:
    return user.role in (UserRole.exec, UserRole.admin)


# ── Opportunities ─────────────────────────────────────────────────────────────

def can_post_opportunity(user: User) -> bool:
    return user.role in (UserRole.exec, UserRole.admin)


def can_publish_opportunity(user: User) -> bool:
    return user.role == UserRole.admin


# ── News ──────────────────────────────────────────────────────────────────────

def can_write_news(user: User) -> bool:
    return user.role in (UserRole.exec, UserRole.admin)


def can_publish_news(user: User) -> bool:
    return user.role == UserRole.admin


# ── User management ───────────────────────────────────────────────────────────

def can_manage_users(user: User) -> bool:
    return user.role == UserRole.admin


def can_view_audit_logs(user: User) -> bool:
    return user.role == UserRole.admin


# ── Generic helper ────────────────────────────────────────────────────────────

def assert_permission(allowed: bool, detail: str = "Permission denied.") -> None:
    """
    Raise HTTPException(403) if permission check fails.

    Usage in service layer (not route layer):
        assert_permission(can_publish_resource(current_user))
    """
    from fastapi import HTTPException, status

    if not allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
