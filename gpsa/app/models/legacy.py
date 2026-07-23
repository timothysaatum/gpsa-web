import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class LeadershipAdministration(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "leadership_administrations"

    term_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leadership_terms.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    academic_year: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    theme: Mapped[str | None] = mapped_column(String(255), nullable=True)
    slogan: Mapped[str | None] = mapped_column(String(255), nullable=True)
    starts_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    ends_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    group_photo_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    group_photo_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    group_photo_alt: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="published", nullable=False, index=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    executive_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    committee_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    initiatives_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lives_impacted: Mapped[str | None] = mapped_column(String(50), default="5,600+", nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    achievements: Mapped[list["AdministrationAchievement"]] = relationship(
        back_populates="administration",
        cascade="all, delete-orphan",
        order_by="AdministrationAchievement.display_order",
    )


class AdministrationAchievement(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "administration_achievements"

    administration_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leadership_administrations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    year_label: Mapped[str | None] = mapped_column(String(20), nullable=True)
    image_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    image_alt: Mapped[str | None] = mapped_column(String(500), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="verified", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="published", nullable=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    administration: Mapped[LeadershipAdministration] = relationship(back_populates="achievements")


class LeadershipTimelineEvent(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "leadership_timeline_events"

    year_label: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    icon_name: Mapped[str | None] = mapped_column(String(100), default="Building", nullable=True)
    source_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="verified", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="published", nullable=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class RecognitionCategory(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "recognition_categories"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(150), nullable=False, unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon_name: Mapped[str | None] = mapped_column(String(100), default="Award", nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="published", nullable=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)

    honourees: Mapped[list["RecognitionHonouree"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="RecognitionHonouree.display_order",
    )


class RecognitionHonouree(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "recognition_honourees"

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recognition_categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    leader_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leaders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    full_name_override: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    citation: Mapped[str | None] = mapped_column(Text, nullable=True)
    recognition_year: Mapped[str | None] = mapped_column(String(20), nullable=True)
    class_year: Mapped[str | None] = mapped_column(String(50), nullable=True)
    photo_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    photo_alt: Mapped[str | None] = mapped_column(String(500), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="verified", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="published", nullable=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    category: Mapped[RecognitionCategory] = relationship(back_populates="honourees")


class LegacyAward(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "legacy_awards"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    award_year: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    recipient_type: Mapped[str] = mapped_column(String(50), default="association", nullable=False)
    recipient_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    citation: Mapped[str] = mapped_column(Text, nullable=False)
    image_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    image_alt: Mapped[str | None] = mapped_column(String(500), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="verified", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="published", nullable=False, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class HistoricalRecordSubmission(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "historical_record_submissions"

    submitter_name: Mapped[str] = mapped_column(String(255), nullable=False)
    submitter_email: Mapped[str] = mapped_column(String(255), nullable=False)
    submitter_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    relationship_to_gpsa: Mapped[str | None] = mapped_column(String(100), nullable=True)
    record_type: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    administration_year: Mapped[str | None] = mapped_column(String(20), nullable=True)
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    file_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    consent_to_archive: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    consent_to_publish: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="submitted", nullable=False, index=True)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class LeaderNomination(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "leader_nominations"

    nominee_name: Mapped[str] = mapped_column(String(255), nullable=False)
    nominee_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recognition_categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    administration_year: Mapped[str | None] = mapped_column(String(20), nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    achievements: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_file_key: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    evidence_file_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    nominator_name: Mapped[str] = mapped_column(String(255), nullable=False)
    nominator_email: Mapped[str] = mapped_column(String(255), nullable=False)
    relationship_to_nominee: Mapped[str | None] = mapped_column(String(100), nullable=True)
    consent_confirmed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="submitted", nullable=False, index=True)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
