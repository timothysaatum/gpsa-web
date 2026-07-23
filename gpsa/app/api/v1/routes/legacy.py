import uuid
from datetime import UTC, date, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from pydantic import Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.routes.cms import get_published_page
from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.leadership import Leader, LeadershipTerm
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
from app.repositories.base import BaseRepository
from app.schemas.common import AppModel, MessageResponse
from app.schemas.legacy import (
    AdministrationAchievementSchema,
    AdministrationLeaderGroupSchema,
    AdministrationResponse,
    HeroStatSchema,
    HistoricalRecordSubmissionCreated,
    HistoricalRecordSubmissionRequest,
    LeaderNominationRequest,
    LeaderSummarySchema,
    LegacyAwardResponse,
    LegacyPageResponse,
    NominationReviewRequest,
    RecognitionCategoryResponse,
    RecognitionHonoureeResponse,
    SubmissionReviewRequest,
    TimelineEventResponse,
)
from app.services.audit import AuditService
from app.services.storage import storage
from app.utils.file_validation import FileValidationError, validate_attachment_file

router = APIRouter(prefix="/about/legacy", tags=["Past Leadership & Recognition"])

_CONTENT_MODELS: dict[str, tuple[type, set[str]]] = {
    "administrations": (LeadershipAdministration, {
        "term_id", "academic_year", "slug", "title", "theme", "slogan", "starts_at", "ends_at",
        "group_photo_url", "group_photo_alt", "is_current", "status", "summary",
        "executive_count", "committee_count", "initiatives_count", "lives_impacted",
        "display_order", "published_at",
    }),
    "achievements": (AdministrationAchievement, {
        "administration_id", "title", "summary", "description", "category", "year_label",
        "image_url", "image_alt", "verification_status", "status", "display_order", "published_at",
    }),
    "timeline": (LeadershipTimelineEvent, {
        "year_label", "event_date", "title", "summary", "icon_name", "source_reference",
        "verification_status", "status", "display_order", "published_at",
    }),
    "categories": (RecognitionCategory, {
        "name", "slug", "description", "icon_name", "status", "display_order",
    }),
    "honourees": (RecognitionHonouree, {
        "category_id", "leader_id", "full_name_override", "title", "citation",
        "recognition_year", "class_year", "photo_url", "photo_alt",
        "verification_status", "status", "display_order", "published_at",
    }),
    "awards": (LegacyAward, {
        "title", "slug", "award_year", "category", "recipient_type", "recipient_name",
        "citation", "image_url", "image_alt", "verification_status", "status",
        "is_featured", "display_order", "published_at",
    }),
}


class LegacyContentWrite(AppModel):
    data: dict[str, Any] = Field(default_factory=dict)


def _content_config(resource: str) -> tuple[type, set[str]]:
    config = _CONTENT_MODELS.get(resource)
    if config is None:
        raise HTTPException(status_code=404, detail="Unknown legacy content resource.")
    return config


def _clean_content_data(data: dict[str, Any], allowed: set[str]) -> dict[str, Any]:
    unknown = set(data) - allowed
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unsupported fields: {', '.join(sorted(unknown))}")
    if "status" in data and data["status"] not in {"draft", "published", "archived"}:
        raise HTTPException(status_code=422, detail="Status must be draft, published or archived.")
    if "verification_status" in data and data["verification_status"] not in {"pending", "verified", "rejected"}:
        raise HTTPException(status_code=422, detail="Verification status must be pending, verified or rejected.")
    cleaned = dict(data)
    for key in ("term_id", "administration_id", "category_id", "leader_id"):
        if cleaned.get(key):
            try:
                cleaned[key] = uuid.UUID(str(cleaned[key]))
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=f"{key} must be a valid UUID.") from exc
    for key in ("starts_at", "ends_at", "event_date"):
        if cleaned.get(key) and isinstance(cleaned[key], str):
            try:
                cleaned[key] = date.fromisoformat(cleaned[key])
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=f"{key} must use YYYY-MM-DD.") from exc
    if cleaned.get("published_at") and isinstance(cleaned["published_at"], str):
        try:
            cleaned["published_at"] = datetime.fromisoformat(cleaned["published_at"].replace("Z", "+00:00"))
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="published_at must be an ISO-8601 datetime.") from exc
    return cleaned


def _manager_dependency():
    return Depends(require_roles(UserRole.exec, UserRole.admin))


def _admin_dependency():
    return Depends(require_roles(UserRole.admin))


@router.get("", response_model=LegacyPageResponse, summary="Get public Past Leadership & Recognition page data")
@router.get("/", response_model=LegacyPageResponse, summary="Get public Past Leadership & Recognition page data")
async def get_legacy_page(
    db: Annotated[AsyncSession, Depends(get_db)],
    year: str | None = None,
) -> LegacyPageResponse:
    """
    Public aggregated data endpoint for /about/legacy page.
    Only returns published and verified records.
    """
    # 1. Statistics
    stats = [
        HeroStatSchema(label="Administrations", value="10+", icon_name="Building"),
        HeroStatSchema(label="Leaders Recognised", value="150+", icon_name="Award"),
        HeroStatSchema(label="Lives Impacted", value="5,600+", icon_name="Users"),
        HeroStatSchema(label="Legacy Metric", value="A Legacy That Inspires Generations", icon_name="Sparkles"),
    ]

    # 2. Administrations
    admin_stmt = (
        select(LeadershipAdministration)
        .options(selectinload(LeadershipAdministration.achievements))
        .where(
            LeadershipAdministration.deleted_at.is_(None),
            LeadershipAdministration.status == "published",
        )
        .order_by(LeadershipAdministration.display_order.asc(), LeadershipAdministration.academic_year.desc())
    )
    admin_result = await db.execute(admin_stmt)
    administrations_raw = list(admin_result.scalars().unique().all())

    # Get Leaders for the current/selected administration
    leaders_by_term: dict[uuid.UUID, list[Leader]] = {}
    terms_stmt = (
        select(LeadershipTerm)
        .options(selectinload(LeadershipTerm.leaders))
        .where(LeadershipTerm.deleted_at.is_(None))
        .order_by(LeadershipTerm.sort_order.asc())
    )
    terms_res = await db.execute(terms_stmt)
    terms = list(terms_res.scalars().unique().all())
    for term in terms:
        active_leaders = [
            leader
            for leader in term.leaders
            if leader.deleted_at is None and leader.is_active
        ]
        leaders_by_term[term.id] = active_leaders

    administrations_formatted: list[AdministrationResponse] = []
    selected_admin: AdministrationResponse | None = None

    for admin in administrations_raw:
        leaders_list = leaders_by_term.get(admin.term_id, [])

        # Sort leaders according to prompt rules: President first, Vice President second, remaining after
        pres: LeaderSummarySchema | None = None
        vp: LeaderSummarySchema | None = None
        others: list[LeaderSummarySchema] = []

        for leader in sorted(leaders_list, key=lambda item: item.sort_order):
            office_lower = (leader.office or "").lower()
            summary = LeaderSummarySchema(
                id=leader.id,
                full_name=leader.full_name,
                office=leader.office,
                photo_url=leader.photo_url
                or (storage.cdn_url(leader.photo_key) if leader.photo_key else None),
            )
            if "vice" in office_lower and "president" in office_lower and not vp:
                vp = summary
            elif "president" in office_lower and not pres:
                pres = summary
            else:
                others.append(summary)

        top_leadership = AdministrationLeaderGroupSchema(
            president=pres,
            vice_president=vp,
            other_executives_count=max(
                0,
                admin.executive_count - (2 if pres and vp else 1 if pres or vp else 0),
            ),
            other_executives=others,
        )

        formatted_achievements = [
            AdministrationAchievementSchema(
                id=ach.id,
                title=ach.title,
                summary=ach.summary,
                category=ach.category,
                image_url=ach.image_url or (storage.cdn_url(ach.image_key) if ach.image_key else None),
            )
            for ach in admin.achievements
            if ach.deleted_at is None and ach.status == "published"
        ]

        admin_resp = AdministrationResponse(
            id=admin.id,
            academic_year=admin.academic_year,
            slug=admin.slug,
            title=admin.title,
            theme=admin.theme,
            slogan=admin.slogan,
            starts_at=admin.starts_at,
            ends_at=admin.ends_at,
            group_photo_url=admin.group_photo_url or (storage.cdn_url(admin.group_photo_key) if admin.group_photo_key else None),
            group_photo_alt=admin.group_photo_alt,
            is_current=admin.is_current,
            status=admin.status,
            summary=admin.summary,
            executive_count=admin.executive_count,
            committee_count=admin.committee_count,
            initiatives_count=admin.initiatives_count,
            lives_impacted=admin.lives_impacted,
            display_order=admin.display_order,
            top_leadership=top_leadership,
            achievements=formatted_achievements,
        )

        administrations_formatted.append(admin_resp)

        if year and (admin.academic_year == year or admin.slug == year) or not selected_admin and admin.is_current:
            selected_admin = admin_resp

    if not selected_admin and administrations_formatted:
        selected_admin = administrations_formatted[0]

    # 3. Leadership Timeline
    timeline_stmt = (
        select(LeadershipTimelineEvent)
        .where(
            LeadershipTimelineEvent.deleted_at.is_(None),
            LeadershipTimelineEvent.status == "published",
        )
        .order_by(LeadershipTimelineEvent.display_order.asc(), LeadershipTimelineEvent.year_label.asc())
    )
    timeline_res = await db.execute(timeline_stmt)
    timeline_events = list(timeline_res.scalars().all())
    formatted_timeline = [
        TimelineEventResponse(
            id=t.id,
            year_label=t.year_label,
            event_date=t.event_date,
            title=t.title,
            summary=t.summary,
            icon_name=t.icon_name,
            verification_status=t.verification_status,
            status=t.status,
            display_order=t.display_order,
        )
        for t in timeline_events
    ]

    # 4. Recognition Categories
    categories_stmt = (
        select(RecognitionCategory)
        .where(
            RecognitionCategory.deleted_at.is_(None),
            RecognitionCategory.status == "published",
        )
        .order_by(RecognitionCategory.display_order.asc())
    )
    categories_res = await db.execute(categories_stmt)
    categories = list(categories_res.scalars().all())

    # Count published honourees per category
    honouree_counts: dict[uuid.UUID, int] = {}
    count_stmt = (
        select(RecognitionHonouree.category_id, func.count(RecognitionHonouree.id))
        .where(RecognitionHonouree.deleted_at.is_(None), RecognitionHonouree.status == "published")
        .group_by(RecognitionHonouree.category_id)
    )
    count_res = await db.execute(count_stmt)
    for cat_id, cnt in count_res.all():
        honouree_counts[cat_id] = cnt

    formatted_categories = [
        RecognitionCategoryResponse(
            id=c.id,
            name=c.name,
            slug=c.slug,
            description=c.description,
            icon_name=c.icon_name,
            honourees_count=honouree_counts.get(c.id, 0),
        )
        for c in categories
    ]

    # 5. Featured Awards
    awards_stmt = (
        select(LegacyAward)
        .where(
            LegacyAward.deleted_at.is_(None),
            LegacyAward.status == "published",
            LegacyAward.is_featured.is_(True),
        )
        .order_by(LegacyAward.display_order.asc(), LegacyAward.award_year.desc())
    )
    awards_res = await db.execute(awards_stmt)
    awards = list(awards_res.scalars().all())
    formatted_awards = [
        LegacyAwardResponse(
            id=a.id,
            title=a.title,
            slug=a.slug,
            award_year=a.award_year,
            category=a.category,
            recipient_type=a.recipient_type,
            recipient_name=a.recipient_name,
            citation=a.citation,
            image_url=a.image_url or (storage.cdn_url(a.image_key) if a.image_key else None),
            image_alt=a.image_alt,
            is_featured=a.is_featured,
            display_order=a.display_order,
        )
        for a in awards
    ]

    response = LegacyPageResponse(
        statistics=stats,
        administrations=administrations_formatted,
        selected_administration=selected_admin,
        timeline=formatted_timeline,
        recognition_categories=formatted_categories,
        featured_awards=formatted_awards,
    )
    cms_page = await get_published_page(db, "past-leadership")
    if cms_page:
        editable_fields = {
            "hero_eyebrow", "hero_headline_primary", "hero_headline_secondary",
            "hero_supporting_text", "hero_quote_text", "hero_quote_citation", "statistics",
        }
        overrides = {key: value for key, value in cms_page.content.items() if key in editable_fields}
        return response.model_copy(update=overrides)
    return response


@router.get("/recognition/{category_slug}", response_model=list[RecognitionHonoureeResponse])
async def list_public_honourees(
    category_slug: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RecognitionHonoureeResponse]:
    result = await db.execute(
        select(RecognitionHonouree, RecognitionCategory)
        .join(RecognitionCategory, RecognitionCategory.id == RecognitionHonouree.category_id)
        .where(
            RecognitionCategory.slug == category_slug,
            RecognitionCategory.status == "published",
            RecognitionCategory.deleted_at.is_(None),
            RecognitionHonouree.status == "published",
            RecognitionHonouree.deleted_at.is_(None),
        )
        .order_by(RecognitionHonouree.display_order.asc())
    )
    return [
        RecognitionHonoureeResponse(
            id=honouree.id,
            category_id=honouree.category_id,
            full_name=honouree.full_name_override,
            title=honouree.title,
            citation=honouree.citation,
            recognition_year=honouree.recognition_year,
            class_year=honouree.class_year,
            photo_url=honouree.photo_url or (storage.cdn_url(honouree.photo_key) if honouree.photo_key else None),
            photo_alt=honouree.photo_alt,
        )
        for honouree, _ in result.all()
    ]


@router.get("/awards", response_model=list[LegacyAwardResponse])
async def list_public_awards(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[LegacyAwardResponse]:
    result = await db.execute(
        select(LegacyAward)
        .where(
            LegacyAward.status == "published",
            LegacyAward.deleted_at.is_(None),
        )
        .order_by(LegacyAward.award_year.desc(), LegacyAward.display_order.asc())
        .limit(200)
    )
    return [
        LegacyAwardResponse(
            id=award.id, title=award.title, slug=award.slug, award_year=award.award_year,
            category=award.category, recipient_type=award.recipient_type,
            recipient_name=award.recipient_name, citation=award.citation,
            image_url=award.image_url or (storage.cdn_url(award.image_key) if award.image_key else None),
            image_alt=award.image_alt, is_featured=award.is_featured,
            display_order=award.display_order,
        )
        for award in result.scalars().all()
    ]


@router.post("/submissions", response_model=HistoricalRecordSubmissionCreated, status_code=status.HTTP_201_CREATED, summary="Submit historical records")
async def submit_historical_record(
    payload: HistoricalRecordSubmissionRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HistoricalRecordSubmissionCreated:
    """
    Public submission endpoint for historical photographs, documents, speeches, stories.
    Does NOT publish automatically. Saved in draft/submitted state for admin review.
    """
    submission = HistoricalRecordSubmission(
        submitter_name=payload.submitter_name,
        submitter_email=payload.submitter_email,
        submitter_phone=payload.submitter_phone,
        relationship_to_gpsa=payload.relationship_to_gpsa,
        record_type=payload.record_type,
        title=payload.title,
        description=payload.description,
        administration_year=payload.administration_year,
        event_date=payload.event_date,
        consent_to_archive=payload.consent_to_archive,
        consent_to_publish=payload.consent_to_publish,
        status="submitted",
    )
    db.add(submission)
    await db.commit()

    return HistoricalRecordSubmissionCreated(
        id=submission.id,
        message="Thank you! Your historical record submission has been received and queued for admin review."
    )


@router.post("/submissions/{submission_id}/file", response_model=MessageResponse, summary="Attach a file to a historical submission")
async def upload_historical_record_file(
    submission_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
) -> MessageResponse:
    result = await db.execute(
        select(HistoricalRecordSubmission).where(
            HistoricalRecordSubmission.id == submission_id,
            HistoricalRecordSubmission.deleted_at.is_(None),
            HistoricalRecordSubmission.status == "submitted",
            HistoricalRecordSubmission.file_key.is_(None),
        )
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found or already has an attachment.")
    content = await file.read()
    try:
        validated = validate_attachment_file(content, file.filename or "historical-record")
    except FileValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    key = await storage.upload(
        content=validated.content,
        folder="legacy-submissions",
        filename=file.filename or "historical-record",
        mime_type=validated.mime_type,
        public=False,
    )
    submission.file_key = key
    submission.original_filename = file.filename
    submission.mime_type = validated.mime_type
    submission.file_size_bytes = validated.size_bytes
    await db.commit()
    return MessageResponse(message="Attachment uploaded securely.")


@router.post("/nominations", response_model=MessageResponse, status_code=status.HTTP_201_CREATED, summary="Nominate a leader for recognition")
async def submit_leader_nomination(
    payload: LeaderNominationRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """
    Public nomination endpoint for leaders, alumni, and committee champions.
    Saved in submitted state for official verification.
    """
    nomination = LeaderNomination(
        nominee_name=payload.nominee_name,
        nominee_email=payload.nominee_email,
        category_id=payload.category_id,
        administration_year=payload.administration_year,
        reason=payload.reason,
        achievements=payload.achievements,
        nominator_name=payload.nominator_name,
        nominator_email=payload.nominator_email,
        relationship_to_nominee=payload.relationship_to_nominee,
        consent_confirmed=payload.consent_confirmed,
        status="submitted",
    )
    db.add(nomination)
    await db.commit()

    return MessageResponse(
        message="Thank you! Your leader nomination has been submitted and queued for verification."
    )


# ── Admin Routes ──────────────────────────────────────────────────────────────


@router.get("/admin/content/{resource}", dependencies=[_manager_dependency()])
async def list_legacy_content(
    resource: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 100,
    offset: int = 0,
):
    model, _ = _content_config(resource)
    stmt = (
        select(model)
        .where(model.deleted_at.is_(None))
        .order_by(getattr(model, "display_order", model.created_at).asc())
        .offset(max(offset, 0))
        .limit(min(max(limit, 1), 200))
    )
    return list((await db.execute(stmt)).scalars().all())


@router.post("/admin/content/{resource}", status_code=status.HTTP_201_CREATED, dependencies=[_manager_dependency()])
async def create_legacy_content(
    resource: str,
    payload: LegacyContentWrite,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    model, allowed = _content_config(resource)
    data = _clean_content_data(payload.data, allowed)
    instance = await BaseRepository(model, db).create(data)
    await AuditService(db).log(
        action="CREATE", entity_type=f"legacy_{resource}", entity_id=instance.id,
        new_values={k: str(v) for k, v in data.items()}, request=request,
    )
    await db.commit()
    return instance


@router.patch("/admin/content/{resource}/{item_id}", dependencies=[_manager_dependency()])
async def update_legacy_content(
    resource: str,
    item_id: uuid.UUID,
    payload: LegacyContentWrite,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    model, allowed = _content_config(resource)
    data = _clean_content_data(payload.data, allowed)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update.")
    repo = BaseRepository(model, db)
    instance = await repo.get_by_id_or_404(item_id)
    instance = await repo.update(instance, data)
    await AuditService(db).log(
        action="UPDATE", entity_type=f"legacy_{resource}", entity_id=instance.id,
        new_values={k: str(v) for k, v in data.items()}, request=request,
    )
    await db.commit()
    return instance


@router.delete("/admin/content/{resource}/{item_id}", response_model=MessageResponse, dependencies=[_manager_dependency()])
async def delete_legacy_content(
    resource: str,
    item_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    model, _ = _content_config(resource)
    repo = BaseRepository(model, db)
    instance = await repo.get_by_id_or_404(item_id)
    await repo.soft_delete(instance)
    await AuditService(db).log(
        action="DELETE", entity_type=f"legacy_{resource}", entity_id=instance.id, request=request,
    )
    await db.commit()
    return MessageResponse(message="Content removed.")


@router.get("/admin/submissions", summary="List historical submissions for review", dependencies=[_manager_dependency()])
async def list_admin_submissions(
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    stmt = select(HistoricalRecordSubmission).where(HistoricalRecordSubmission.deleted_at.is_(None))
    if status_filter:
        stmt = stmt.where(HistoricalRecordSubmission.status == status_filter)
    stmt = stmt.order_by(HistoricalRecordSubmission.created_at.desc()).offset(offset).limit(limit)
    res = await db.execute(stmt)
    submissions = list(res.scalars().all())
    for submission in submissions:
        if submission.file_key:
            submission.file_url = await storage.presign(submission.file_key)
    return submissions


@router.patch("/admin/submissions/{submission_id}", summary="Review historical submission", dependencies=[_manager_dependency()])
async def review_admin_submission(
    submission_id: uuid.UUID,
    payload: SubmissionReviewRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    res = await db.execute(
        select(HistoricalRecordSubmission).where(
            HistoricalRecordSubmission.id == submission_id,
            HistoricalRecordSubmission.deleted_at.is_(None),
        )
    )
    submission = res.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    submission.status = payload.status
    if payload.review_notes:
        submission.review_notes = payload.review_notes
    submission.reviewed_by = current_user.id
    submission.reviewed_at = datetime.now(UTC)

    await AuditService(db).log(
        action="REVIEW_HISTORICAL_SUBMISSION",
        entity_type="historical_record_submission",
        entity_id=submission.id,
        new_values={"status": payload.status, "review_notes": payload.review_notes},
        request=request,
    )
    await db.commit()
    return submission


@router.get("/admin/nominations", summary="List leader nominations for review", dependencies=[_manager_dependency()])
async def list_admin_nominations(
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    stmt = select(LeaderNomination).where(LeaderNomination.deleted_at.is_(None))
    if status_filter:
        stmt = stmt.where(LeaderNomination.status == status_filter)
    stmt = stmt.order_by(LeaderNomination.created_at.desc()).offset(offset).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.patch("/admin/nominations/{nomination_id}", summary="Review leader nomination", dependencies=[_manager_dependency()])
async def review_admin_nomination(
    nomination_id: uuid.UUID,
    payload: NominationReviewRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    res = await db.execute(
        select(LeaderNomination).where(
            LeaderNomination.id == nomination_id,
            LeaderNomination.deleted_at.is_(None),
        )
    )
    nomination = res.scalar_one_or_none()
    if not nomination:
        raise HTTPException(status_code=404, detail="Nomination not found.")

    nomination.status = payload.status
    if payload.review_notes:
        nomination.review_notes = payload.review_notes
    nomination.reviewed_by = current_user.id
    nomination.reviewed_at = datetime.now(UTC)

    await AuditService(db).log(
        action="REVIEW_LEADER_NOMINATION",
        entity_type="leader_nomination",
        entity_id=nomination.id,
        new_values={"status": payload.status, "review_notes": payload.review_notes},
        request=request,
    )
    await db.commit()
    return nomination
