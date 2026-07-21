import enum


# ── Users ─────────────────────────────────────────────────────────────────────
class UserRole(enum.StrEnum):
    student = "student"
    exec = "exec"
    admin = "admin"


# ── Academic Resources ────────────────────────────────────────────────────────
class ContentType(enum.StrEnum):
    exam_questions = "exam_questions"
    lecture_slides = "lecture_slides"
    tutorial_videos = "tutorial_videos"
    lab_reports = "lab_reports"
    field_materials = "field_materials"


class Trimester(enum.StrEnum):
    first = "first"
    second = "second"
    third = "third"


class FileType(enum.StrEnum):
    pdf = "pdf"
    video = "video"
    doc = "doc"
    image = "image"
    other = "other"


# ── Events ────────────────────────────────────────────────────────────────────
class EventType(enum.StrEnum):
    academic = "academic"
    welfare = "welfare"
    outreach = "outreach"
    social = "social"
    conference = "conference"


class EventStatus(enum.StrEnum):
    upcoming = "upcoming"
    ongoing = "ongoing"
    past = "past"


# ── Welfare ───────────────────────────────────────────────────────────────────
class ReportType(enum.StrEnum):
    issue = "issue"
    support = "support"
    confidential = "confidential"


class WelfareCategory(enum.StrEnum):
    academic = "academic"
    welfare = "welfare"
    financial = "financial"
    health = "health"
    other = "other"


class ReportStatus(enum.StrEnum):
    pending = "pending"
    in_review = "in_review"
    resolved = "resolved"


# ── Opportunities ─────────────────────────────────────────────────────────────
class OpportunityType(enum.StrEnum):
    internship = "internship"
    scholarship = "scholarship"
    job = "job"
    training = "training"


# ── News ──────────────────────────────────────────────────────────────────────
class NewsCategory(enum.StrEnum):
    announcement = "announcement"
    academic_update = "academic_update"
    welfare_update = "welfare_update"
    events_recap = "events_recap"
    opportunities = "opportunities"
    general = "general"


# ── Notifications ─────────────────────────────────────────────────────────────
class NotificationType(enum.StrEnum):
    event_reminder = "event_reminder"
    event_registration = "event_registration"
    welfare_status_change = "welfare_status_change"
    opportunity_posted = "opportunity_posted"
    news_published = "news_published"
    general = "general"


# ── Feedback ──────────────────────────────────────────────────────────────────
class FeedbackEntityType(enum.StrEnum):
    event = "event"
    academic_resource = "academic_resource"
    opportunity = "opportunity"


# ── Gallery ──────────────────────────────────────────────────────────────────
class GalleryCategory(enum.StrEnum):
    events = "events"
    academic = "academic"
    health = "health"
    outreach = "outreach"
    social = "social"
    welfare = "welfare"


# ── Email Logs ────────────────────────────────────────────────────────────────
class EmailStatus(enum.StrEnum):
    pending = "pending"
    sent = "sent"
    failed = "failed"
    permanent_failure = "permanent_failure"


class EmailTemplate(enum.StrEnum):
    email_verification = "email_verification"
    password_reset = "password_reset"
    event_registration_confirmation = "event_registration_confirmation"
    welfare_report_received = "welfare_report_received"
    welfare_status_update = "welfare_status_update"
    new_opportunity = "new_opportunity"
    event_reminder = "event_reminder"
    certificate_issued = "certificate_issued"
