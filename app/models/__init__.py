"""
Import all ORM models here so that:

1. Alembic's env.py only needs to import this module to discover
   every table for autogenerate.

2. SQLAlchemy's relationship() back-references resolve correctly
   regardless of import order in the rest of the codebase.

3. The app has a single canonical place to verify the full model inventory.
"""

from app.models.academic_resource import AcademicResource
from app.models.audit import AuditLog
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.email_log import EmailLog
from app.models.enums import (
    ContentType,
    EmailStatus,
    EmailTemplate,
    EventStatus,
    EventType,
    FeedbackEntityType,
    FileType,
    NewsCategory,
    NotificationType,
    OpportunityType,
    ReportStatus,
    ReportType,
    Trimester,
    UserRole,
    WelfareCategory,
)
from app.models.event import Event, EventRegistration
from app.models.feedback import Feedback
from app.models.news import NewsPost
from app.models.notification import Notification
from app.models.opportunity import Opportunity
from app.models.token import PasswordResetToken, RefreshToken
from app.models.user import User
from app.models.welfare import WelfareReport, WelfareSpotlight

__all__ = [
    # Auth
    "User",
    "RefreshToken",
    "PasswordResetToken",
    # Audit / Email
    "AuditLog",
    "EmailLog",
    # Academics
    "Course",
    "AcademicResource",
    # Events
    "Event",
    "EventRegistration",
    # Welfare
    "WelfareReport",
    "WelfareSpotlight",
    # Opportunities
    "Opportunity",
    # News
    "NewsPost",
    # Notifications
    "Notification",
    # Certificates
    "Certificate",
    # Feedback
    "Feedback",
    # Enums (re-exported for convenience)
    "UserRole",
    "ContentType",
    "Trimester",
    "FileType",
    "EventType",
    "EventStatus",
    "ReportType",
    "WelfareCategory",
    "ReportStatus",
    "OpportunityType",
    "NewsCategory",
    "NotificationType",
    "FeedbackEntityType",
    "EmailStatus",
    "EmailTemplate",
]
