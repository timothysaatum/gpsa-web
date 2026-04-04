from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, Integer, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.academic_resource import AcademicResource
from app.models.audit import AuditLog
from app.models.enums import UserRole
from app.models.event import EventRegistration
from app.models.token import PasswordResetToken, RefreshToken


class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    student_id: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)
    level: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)  # 100–600

    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", create_constraint=True),
        nullable=False,
        default=UserRole.student,
    )

    # Auth
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Brute-force protection
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="noload"
    )
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="noload"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        back_populates="actor", foreign_keys="AuditLog.actor_id", lazy="noload"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="noload"
    )
    event_registrations: Mapped[list["EventRegistration"]] = relationship(
        back_populates="user", lazy="noload"
    )
    uploaded_resources: Mapped[list["AcademicResource"]] = relationship(
        back_populates="uploaded_by_user", foreign_keys="AcademicResource.uploaded_by", lazy="noload"
    )
    news_posts: Mapped[list["NewsPost"]] = relationship(
        back_populates="author", foreign_keys="NewsPost.author_id", lazy="noload"
    )
    certificates: Mapped[list["Certificate"]] = relationship(
        back_populates="user", lazy="noload"
    )
    feedback: Mapped[list["Feedback"]] = relationship(
        back_populates="submitted_by_user", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"