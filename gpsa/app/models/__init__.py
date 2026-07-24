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
from app.models.cms import CmsPage
from app.models.contact import ContactSubmission
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
    GalleryCategory,
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
from app.models.gallery import GalleryImage
from app.models.governance import (
    DocumentCategory,
    DocumentVersion,
    FaqCategory,
    FaqEntry,
    GovernanceDocument,
)
from app.models.hero_slide import HeroSlide
from app.models.impact import (
    ImpactFocusArea,
    ImpactInitiative,
    ImpactMetric,
    ImpactReport,
    ImpactReportingPeriod,
    ImpactSdgAlignment,
    SdgGoal,
    StrategicPriority,
)
from app.models.leadership import Leader, LeadershipOffice, LeadershipTerm
from app.models.legacy import (
    AdministrationAchievement,
    HistoricalRecordSubmission,
    LeaderNomination,
    LeadershipAdministration,
    LeadershipTimelineEvent,
    LegacyAward,
    RecognitionCategory,
    RecognitionHonouree,
)
from app.models.news import NewsPost
from app.models.notification import Notification
from app.models.opportunity import Opportunity
from app.models.partner import Partner
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
    # Gallery
    "GalleryImage",
    "DocumentCategory",
    "GovernanceDocument",
    "DocumentVersion",
    "FaqCategory",
    "FaqEntry",
    # Welfare
    "WelfareReport",
    "WelfareSpotlight",
    # Opportunities
    "Opportunity",
    # Partners
    "Partner",
    # News
    "NewsPost",
    # Notifications
    "Notification",
    # Certificates
    "Certificate",
    "ContactSubmission",
    # Hero
    "HeroSlide",
    # Leadership & Legacy
    "LeadershipTerm",
    "LeadershipOffice",
    "CmsPage",
    "ImpactReportingPeriod",
    "StrategicPriority",
    "ImpactMetric",
    "ImpactFocusArea",
    "ImpactInitiative",
    "SdgGoal",
    "ImpactSdgAlignment",
    "ImpactReport",
    "Leader",
    "LeadershipAdministration",
    "AdministrationAchievement",
    "LeadershipTimelineEvent",
    "RecognitionCategory",
    "RecognitionHonouree",
    "LegacyAward",
    "HistoricalRecordSubmission",
    "LeaderNomination",
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
    "GalleryCategory",
    "EmailStatus",
    "EmailTemplate",
]
