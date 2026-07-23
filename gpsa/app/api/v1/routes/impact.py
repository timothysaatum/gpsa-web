import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from pydantic import Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routes.cms import get_published_page
from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.impact import (
    ImpactFocusArea, ImpactInitiative, ImpactMetric, ImpactReport,
    ImpactReportingPeriod, ImpactSdgAlignment, SdgGoal, StrategicPriority,
)
from app.models.cms import CmsPage
from app.repositories.base import BaseRepository
from app.schemas.common import AppModel, MessageResponse
from app.services.audit import AuditService
from app.services.storage import storage
from app.utils.file_validation import FileValidationError, validate_attachment_file, validate_image_file

router = APIRouter(prefix="/about/impact", tags=["Impact & Strategic Priorities"])

PUBLISHED = "published"

_RESOURCES: dict[str, tuple[type, set[str]]] = {
    "periods": (ImpactReportingPeriod, {"name", "academic_year", "starts_at", "ends_at", "is_current", "status", "published_at"}),
    "priorities": (StrategicPriority, {"reporting_period_id", "title", "slug", "description", "icon_name", "detail_url", "status", "display_order", "published_at"}),
    "metrics": (ImpactMetric, {"reporting_period_id", "label", "description", "display_value", "numeric_value", "prefix", "suffix", "icon_name", "source_reference", "verification_status", "status", "display_order", "published_at"}),
    "focus-areas": (ImpactFocusArea, {"title", "slug", "summary", "description", "image_url", "image_alt", "icon_name", "detail_url", "status", "display_order", "published_at"}),
    "initiatives": (ImpactInitiative, {"focus_area_id", "reporting_period_id", "title", "slug", "summary", "description", "starts_at", "ends_at", "location", "beneficiary_count", "image_url", "image_alt", "status", "is_featured", "display_order", "published_at"}),
    "sdg-goals": (SdgGoal, {"number", "title", "official_color", "icon_key", "official_url", "is_active"}),
    "sdg-alignments": (ImpactSdgAlignment, {"sdg_goal_id", "reporting_period_id", "summary", "evidence", "source_reference", "status", "display_order", "published_at"}),
    "reports": (ImpactReport, {"reporting_period_id", "title", "slug", "description", "version", "status", "is_public", "published_at"}),
}


class ContentWrite(AppModel):
    data: dict[str, Any] = Field(default_factory=dict)


def _config(resource: str) -> tuple[type, set[str]]:
    if resource not in _RESOURCES:
        raise HTTPException(status_code=404, detail="Unknown impact resource.")
    return _RESOURCES[resource]


def _clean(resource: str, data: dict[str, Any], allowed: set[str]) -> dict[str, Any]:
    unknown = set(data) - allowed
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unsupported fields: {', '.join(sorted(unknown))}")
    clean = dict(data)
    if "status" in clean and clean["status"] not in {"draft", "pending_review", "verified", "published", "archived"}:
        raise HTTPException(status_code=422, detail="Invalid publishing status.")
    if resource == "metrics":
        if clean.get("verification_status") not in {None, "unverified", "verified", "disputed"}:
            raise HTTPException(status_code=422, detail="Invalid metric verification status.")
        if clean.get("status") == PUBLISHED and clean.get("verification_status") != "verified":
            raise HTTPException(status_code=422, detail="Only verified metrics can be published.")
        if clean.get("status") == PUBLISHED and not clean.get("source_reference"):
            raise HTTPException(status_code=422, detail="Published metrics require a source reference.")
    if resource in {"focus-areas", "initiatives"} and clean.get("status") == PUBLISHED and not clean.get("image_alt"):
        raise HTTPException(status_code=422, detail="Published images require alternative text.")
    if resource == "sdg-goals" and clean.get("number") is not None and not 1 <= int(clean["number"]) <= 17:
        raise HTTPException(status_code=422, detail="SDG number must be between 1 and 17.")
    for key in ("detail_url", "image_url", "official_url"):
        value = clean.get(key)
        if value and not (str(value).startswith("/") or str(value).startswith("https://") or str(value).startswith("http://")):
            raise HTTPException(status_code=422, detail=f"{key} must be an internal path or HTTP(S) URL.")
    for key in ("reporting_period_id", "focus_area_id", "sdg_goal_id"):
        if clean.get(key):
            try:
                clean[key] = uuid.UUID(str(clean[key]))
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=f"{key} must be a UUID.") from exc
    for key in ("starts_at", "ends_at"):
        if clean.get(key) and isinstance(clean[key], str):
            clean[key] = date.fromisoformat(clean[key])
    if clean.get("numeric_value") is not None:
        clean["numeric_value"] = Decimal(str(clean["numeric_value"]))
    if clean.get("published_at") and isinstance(clean["published_at"], str):
        clean["published_at"] = datetime.fromisoformat(clean["published_at"].replace("Z", "+00:00"))
    if clean.get("status") == PUBLISHED and not clean.get("published_at"):
        clean["published_at"] = datetime.now(timezone.utc)
    return clean


def _public_dict(item: Any) -> dict[str, Any]:
    return {
        column.name: getattr(item, column.name)
        for column in item.__table__.columns
        if column.name not in {"deleted_at", "created_at", "updated_at", "source_reference", "evidence", "file_key", "image_key", "icon_key"}
    }


def _enforce_publisher(user: CurrentUser, data: dict[str, Any]) -> None:
    if (
        data.get("status") in {"verified", "published", "archived"}
        or data.get("verification_status") in {"verified", "disputed"}
    ) and user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only administrators can verify or publish impact content.")


@router.get("")
@router.get("/")
async def get_impact_page(db: Annotated[AsyncSession, Depends(get_db)]):
    period = (await db.execute(
        select(ImpactReportingPeriod).where(
            ImpactReportingPeriod.deleted_at.is_(None),
            ImpactReportingPeriod.is_current.is_(True),
            ImpactReportingPeriod.status == PUBLISHED,
        ).limit(1)
    )).scalar_one_or_none()
    settings_page = await get_published_page(db, "impact")
    settings = settings_page.content if settings_page else {}
    if period is None:
        return {"settings": settings, "reporting_period": None, "priorities": [], "metrics": [], "focus_areas": [], "featured_initiatives": [], "sdg_alignments": [], "reports": []}

    async def published(model, *conditions):
        result = await db.execute(
            select(model).where(model.deleted_at.is_(None), model.status == PUBLISHED, *conditions)
            .order_by(model.display_order.asc() if hasattr(model, "display_order") else model.created_at.desc())
        )
        return list(result.scalars().all())

    priorities = await published(StrategicPriority, StrategicPriority.reporting_period_id == period.id)
    metrics = await published(ImpactMetric, ImpactMetric.reporting_period_id == period.id, ImpactMetric.verification_status == "verified")
    focus_areas = await published(ImpactFocusArea)
    initiatives = await published(ImpactInitiative, ImpactInitiative.reporting_period_id == period.id, ImpactInitiative.is_featured.is_(True))
    reports = await published(ImpactReport, ImpactReport.reporting_period_id == period.id, ImpactReport.is_public.is_(True), ImpactReport.file_key.is_not(None))
    alignment_result = await db.execute(
        select(ImpactSdgAlignment, SdgGoal)
        .join(SdgGoal, SdgGoal.id == ImpactSdgAlignment.sdg_goal_id)
        .where(
            ImpactSdgAlignment.deleted_at.is_(None),
            ImpactSdgAlignment.reporting_period_id == period.id,
            ImpactSdgAlignment.status == PUBLISHED,
            SdgGoal.is_active.is_(True),
        ).order_by(ImpactSdgAlignment.display_order.asc())
    )
    public_reports = []
    for report in reports:
        item = _public_dict(report)
        item["download_url"] = await storage.presign(report.file_key)
        public_reports.append(item)
    return {
        "settings": settings,
        "reporting_period": _public_dict(period),
        "priorities": [_public_dict(x) for x in priorities],
        "metrics": [_public_dict(x) for x in metrics],
        "focus_areas": [_public_dict(x) for x in focus_areas],
        "featured_initiatives": [_public_dict(x) for x in initiatives],
        "sdg_alignments": [{**_public_dict(a), "goal": _public_dict(g)} for a, g in alignment_result.all()],
        "reports": public_reports,
    }


def _manager():
    return Depends(require_roles(UserRole.exec, UserRole.admin))


@router.get("/admin/{resource}", dependencies=[_manager()])
async def admin_list(resource: str, db: Annotated[AsyncSession, Depends(get_db)]):
    model, _ = _config(resource)
    return list((await db.execute(select(model).where(model.deleted_at.is_(None)).order_by(model.created_at.desc()).limit(200))).scalars().all())


@router.post("/admin/{resource}", status_code=201, dependencies=[_manager()])
async def admin_create(resource: str, payload: ContentWrite, request: Request, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):
    model, allowed = _config(resource)
    data = _clean(resource, payload.data, allowed)
    _enforce_publisher(current_user, data)
    if resource == "reports" and data.get("status") == PUBLISHED:
        raise HTTPException(status_code=422, detail="Upload the report file before publishing.")
    if resource == "periods" and data.get("is_current"):
        await db.execute(update(ImpactReportingPeriod).where(ImpactReportingPeriod.deleted_at.is_(None)).values(is_current=False))
    item = await BaseRepository(model, db).create(data)
    await AuditService(db).log(action="CREATE", entity_type=f"impact_{resource}", entity_id=item.id, new_values={k: str(v) for k, v in data.items()}, request=request)
    await db.commit()
    return item


@router.patch("/admin/{resource}/{item_id}", dependencies=[_manager()])
async def admin_update(resource: str, item_id: uuid.UUID, payload: ContentWrite, request: Request, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):
    model, allowed = _config(resource)
    repo = BaseRepository(model, db)
    item = await repo.get_by_id_or_404(item_id)
    merged = {key: getattr(item, key) for key in allowed}
    merged.update(payload.data)
    data = _clean(resource, merged, allowed)
    _enforce_publisher(current_user, payload.data)
    if resource == "reports" and data.get("status") == PUBLISHED and not item.file_key:
        raise HTTPException(status_code=422, detail="Upload the report file before publishing.")
    if resource == "periods" and data.get("is_current"):
        await db.execute(update(ImpactReportingPeriod).where(ImpactReportingPeriod.id != item_id, ImpactReportingPeriod.deleted_at.is_(None)).values(is_current=False))
    item = await repo.update(item, data)
    await AuditService(db).log(action="UPDATE", entity_type=f"impact_{resource}", entity_id=item.id, new_values={k: str(v) for k, v in payload.data.items()}, request=request)
    await db.commit()
    return item


@router.delete("/admin/{resource}/{item_id}", response_model=MessageResponse, dependencies=[_manager()])
async def admin_delete(resource: str, item_id: uuid.UUID, request: Request, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):
    model, _ = _config(resource)
    repo = BaseRepository(model, db)
    item = await repo.get_by_id_or_404(item_id)
    await repo.soft_delete(item)
    await AuditService(db).log(action="DELETE", entity_type=f"impact_{resource}", entity_id=item.id, request=request)
    await db.commit()
    return MessageResponse(message="Impact content removed.")


@router.post("/admin/focus-areas/{item_id}/image", dependencies=[_manager()])
async def upload_focus_image(item_id: uuid.UUID, request: Request, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)], file: UploadFile = File(...)):
    item = await BaseRepository(ImpactFocusArea, db).get_by_id_or_404(item_id)
    content = await file.read()
    try:
        valid = validate_image_file(content, file.filename or "focus-area.jpg")
    except FileValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    key = await storage.upload(valid.content, "impact", file.filename or "focus-area.jpg", valid.mime_type, public=True)
    item.image_key, item.image_url = key, storage.cdn_url(key)
    await AuditService(db).log(action="UPLOAD_IMAGE", entity_type="impact_focus_area", entity_id=item.id, new_values={"image_key": key}, request=request)
    await db.commit()
    return item


@router.post("/admin/settings/hero/image", dependencies=[_manager()])
async def upload_hero_image(request: Request, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)], file: UploadFile = File(...)):
    page = (await db.execute(select(CmsPage).where(CmsPage.slug == "impact", CmsPage.deleted_at.is_(None)))).scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=409, detail="Save Impact Page Settings before uploading a hero image.")
    content = await file.read()
    try:
        valid = validate_image_file(content, file.filename or "impact-hero.jpg")
    except FileValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    key = await storage.upload(valid.content, "impact", file.filename or "impact-hero.jpg", valid.mime_type, public=True)
    page.content = {**page.content, "hero_image_url": storage.cdn_url(key)}
    page.version += 1
    await AuditService(db).log(action="UPLOAD_HERO_IMAGE", entity_type="cms_page", entity_id=page.id, new_values={"image_key": key}, request=request)
    await db.commit()
    return {"hero_image_url": page.content["hero_image_url"]}


@router.post("/admin/initiatives/{item_id}/image", dependencies=[_manager()])
async def upload_initiative_image(item_id: uuid.UUID, request: Request, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)], file: UploadFile = File(...)):
    item = await BaseRepository(ImpactInitiative, db).get_by_id_or_404(item_id)
    content = await file.read()
    try:
        valid = validate_image_file(content, file.filename or "initiative.jpg")
    except FileValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    key = await storage.upload(valid.content, "impact", file.filename or "initiative.jpg", valid.mime_type, public=True)
    item.image_key, item.image_url = key, storage.cdn_url(key)
    await AuditService(db).log(action="UPLOAD_IMAGE", entity_type="impact_initiative", entity_id=item.id, new_values={"image_key": key}, request=request)
    await db.commit()
    return item


@router.post("/admin/reports/{item_id}/file", dependencies=[_manager()])
async def upload_report(item_id: uuid.UUID, request: Request, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)], file: UploadFile = File(...)):
    item = await BaseRepository(ImpactReport, db).get_by_id_or_404(item_id)
    content = await file.read()
    try:
        valid = validate_attachment_file(content, file.filename or "impact-report.pdf")
    except FileValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    key = await storage.upload(valid.content, "impact-reports", file.filename or "impact-report.pdf", valid.mime_type, public=False)
    item.file_key, item.file_name, item.mime_type, item.file_size_bytes = key, file.filename, valid.mime_type, valid.size_bytes
    await AuditService(db).log(action="UPLOAD_REPORT", entity_type="impact_report", entity_id=item.id, new_values={"file_key": key}, request=request)
    await db.commit()
    return item
