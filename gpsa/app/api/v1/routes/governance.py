import hashlib
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import RedirectResponse
from pydantic import Field
from sqlalchemy import String, cast, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routes.cms import get_published_page
from app.core.dependencies import CurrentUser, get_current_user_optional, require_roles
from app.db.session import get_db
from app.models.enums import FileType, UserRole
from app.models.governance import DocumentCategory, DocumentVersion, FaqCategory, FaqEntry, GovernanceDocument
from app.schemas.common import AppModel, MessageResponse
from app.services.audit import AuditService
from app.services.storage import storage
from app.utils.file_validation import FileValidationError, validate_attachment_file

router = APIRouter(prefix="/about/governance", tags=["Documents & FAQs"])
PUBLISHED = "published"
_RESOURCES = {
    "categories": (DocumentCategory, {"name", "slug", "description", "icon_name", "display_order", "is_active"}),
    "documents": (GovernanceDocument, {"category_id", "title", "slug", "description", "document_type", "version", "edition", "academic_year", "publication_date", "effective_date", "review_date", "external_url", "tags", "is_public", "requires_authentication", "download_enabled", "view_enabled", "status", "verification_status", "display_order", "published_at"}),
    "faq-categories": (FaqCategory, {"name", "slug", "description", "display_order", "is_active"}),
    "faqs": (FaqEntry, {"category_id", "question", "slug", "answer", "short_answer", "keywords", "related_url", "status", "display_order", "is_featured", "published_at"}),
}

class ContentWrite(AppModel):
    data: dict[str, Any] = Field(default_factory=dict)

def _row(item: Any, *, private: bool = False) -> dict[str, Any]:
    hidden = {"deleted_at", "file_key", "checksum"} if not private else {"deleted_at"}
    return {column.name: getattr(item, column.name) for column in item.__table__.columns if column.name not in hidden}

def _clean(resource: str, incoming: dict[str, Any], allowed: set[str]) -> dict[str, Any]:
    unknown = set(incoming) - allowed
    if unknown:
        raise HTTPException(422, f"Unsupported fields: {', '.join(sorted(unknown))}")
    data = dict(incoming)
    if int(data.get("display_order", 0)) < 0:
        raise HTTPException(422, "Display order must be zero or greater.")
    if data.get("status") and data["status"] not in {"draft", "pending_review", "verified", "published", "archived", "withdrawn"}:
        raise HTTPException(422, "Invalid publication status.")
    if data.get("verification_status") and data["verification_status"] not in {"unverified", "verified", "superseded", "withdrawn"}:
        raise HTTPException(422, "Invalid verification status.")
    for key in ("category_id",):
        if data.get(key):
            try: data[key] = uuid.UUID(str(data[key]))
            except ValueError as exc: raise HTTPException(422, f"{key} must be a UUID.") from exc
    for key in ("publication_date", "effective_date", "review_date"):
        if isinstance(data.get(key), str): data[key] = date.fromisoformat(data[key])
    for key in ("external_url", "related_url"):
        if data.get(key) and not str(data[key]).startswith(("https://", "http://", "/")):
            raise HTTPException(422, f"{key} must be an HTTP(S) URL or internal path.")
    if data.get("status") == PUBLISHED and not data.get("published_at"):
        data["published_at"] = datetime.now(timezone.utc)
    return data

def _enforce_publish(user: CurrentUser, data: dict[str, Any]) -> None:
    if (data.get("status") in {PUBLISHED, "archived", "withdrawn"} or data.get("verification_status") in {"verified", "superseded", "withdrawn"}) and user.role != UserRole.admin:
        raise HTTPException(403, "Only administrators can verify, publish, archive, or withdraw content.")

@router.get("")
@router.get("/")
async def governance_page(
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str | None = Query(None, max_length=120),
    category: str | None = Query(None, max_length=120),
    year: str | None = Query(None, max_length=20),
    document_type: str | None = Query(None, max_length=80),
    page: int = Query(1, ge=1),
    page_size: int = Query(8, ge=1, le=24),
):
    settings_page = await get_published_page(db, "governance")
    categories = list((await db.execute(select(DocumentCategory).where(DocumentCategory.deleted_at.is_(None), DocumentCategory.is_active.is_(True)).order_by(DocumentCategory.display_order, DocumentCategory.name))).scalars())
    conditions = [
        GovernanceDocument.deleted_at.is_(None), GovernanceDocument.status == PUBLISHED,
        GovernanceDocument.verification_status == "verified", GovernanceDocument.is_public.is_(True),
        GovernanceDocument.requires_authentication.is_(False),
        or_(GovernanceDocument.file_key.is_not(None), GovernanceDocument.external_url.is_not(None)),
    ]
    query = select(GovernanceDocument, DocumentCategory).join(DocumentCategory, DocumentCategory.id == GovernanceDocument.category_id).where(*conditions)
    if category: query = query.where(DocumentCategory.slug == category)
    if year: query = query.where(GovernanceDocument.academic_year == year)
    if document_type: query = query.where(GovernanceDocument.document_type == document_type)
    if search:
        term = f"%{search.strip()}%"
        query = query.where(or_(
            GovernanceDocument.title.ilike(term), GovernanceDocument.description.ilike(term),
            GovernanceDocument.document_type.ilike(term), GovernanceDocument.academic_year.ilike(term),
            GovernanceDocument.version.ilike(term), DocumentCategory.name.ilike(term),
            cast(GovernanceDocument.tags, String).ilike(term),
        ))
    total = await db.scalar(select(func.count()).select_from(query.order_by(None).subquery()))
    rows = (await db.execute(query.order_by(GovernanceDocument.display_order, GovernanceDocument.publication_date.desc().nullslast()).offset((page - 1) * page_size).limit(page_size))).all()
    documents = []
    for document, document_category in rows:
        item = _row(document)
        item["category"] = {"name": document_category.name, "slug": document_category.slug}
        item["view_url"] = f"/api/v1/about/governance/documents/{document.id}/view" if document.view_enabled else None
        item["download_url"] = f"/api/v1/about/governance/documents/{document.id}/download" if document.download_enabled else None
        documents.append(item)
    faq_rows = (await db.execute(select(FaqEntry, FaqCategory).outerjoin(FaqCategory, FaqCategory.id == FaqEntry.category_id).where(FaqEntry.deleted_at.is_(None), FaqEntry.status == PUBLISHED).order_by(FaqEntry.display_order, FaqEntry.question).limit(12))).all()
    faqs = [{**_row(faq), "category": category_row.name if category_row else None} for faq, category_row in faq_rows]
    return {"settings": settings_page.content if settings_page else {}, "categories": [_row(x) for x in categories], "documents": documents, "pagination": {"page": page, "page_size": page_size, "total": total or 0, "pages": ((total or 0) + page_size - 1) // page_size}, "faqs": faqs}

async def _public_document(document_id: uuid.UUID, db: AsyncSession) -> GovernanceDocument:
    item = (await db.execute(select(GovernanceDocument).where(
        GovernanceDocument.id == document_id, GovernanceDocument.deleted_at.is_(None),
        GovernanceDocument.status == PUBLISHED, GovernanceDocument.verification_status == "verified",
        GovernanceDocument.is_public.is_(True), GovernanceDocument.requires_authentication.is_(False),
    ))).scalar_one_or_none()
    if item is None: raise HTTPException(404, "Document is unavailable.")
    return item

@router.get("/documents/{document_id}/view")
async def view_document(document_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    item = await _public_document(document_id, db)
    if not item.view_enabled: raise HTTPException(403, "Viewing is disabled for this document.")
    url = item.external_url or (await storage.presign(item.file_key, expires_in=300) if item.file_key else None)
    if not url: raise HTTPException(404, "Document file is unavailable.")
    return RedirectResponse(url, status_code=307)

@router.get("/documents/{document_id}/download")
async def download_document(document_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    item = await _public_document(document_id, db)
    if not item.download_enabled: raise HTTPException(403, "Downloading is disabled for this document.")
    url = item.external_url or (await storage.presign(item.file_key, expires_in=300) if item.file_key else None)
    if not url: raise HTTPException(404, "Document file is unavailable.")
    return RedirectResponse(url, status_code=307)

def _manager(): return Depends(require_roles(UserRole.exec, UserRole.admin))

@router.get("/admin/{resource}", dependencies=[_manager()])
async def admin_list(resource: str, db: Annotated[AsyncSession, Depends(get_db)]):
    if resource == "versions":
        return [_row(x, private=True) for x in (await db.execute(select(DocumentVersion).order_by(DocumentVersion.created_at.desc()).limit(250))).scalars()]
    if resource not in _RESOURCES: raise HTTPException(404, "Unknown governance resource.")
    model, _ = _RESOURCES[resource]
    return [_row(x, private=True) for x in (await db.execute(select(model).where(model.deleted_at.is_(None)).order_by(model.created_at.desc()).limit(250))).scalars()]

@router.post("/admin/{resource}", status_code=201, dependencies=[_manager()])
async def admin_create(resource: str, payload: ContentWrite, request: Request, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):
    if resource not in _RESOURCES: raise HTTPException(404, "Unknown governance resource.")
    model, allowed = _RESOURCES[resource]; data = _clean(resource, payload.data, allowed); _enforce_publish(current_user, data)
    if resource == "documents" and data.get("status") == PUBLISHED and not data.get("external_url"):
        raise HTTPException(422, "Upload a file before publishing the document.")
    if resource == "documents" and data.get("status") == PUBLISHED and (not data.get("is_public") or data.get("verification_status") != "verified"):
        raise HTTPException(422, "Published documents must be verified and explicitly public.")
    item = model(**data); db.add(item); await db.flush()
    await AuditService(db).log(action="CREATE", entity_type=f"governance_{resource}", entity_id=item.id, new_values={k: str(v) for k, v in data.items()}, request=request)
    await db.commit(); await db.refresh(item); return _row(item, private=True)

@router.patch("/admin/{resource}/{item_id}", dependencies=[_manager()])
async def admin_update(resource: str, item_id: uuid.UUID, payload: ContentWrite, request: Request, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):
    if resource not in _RESOURCES: raise HTTPException(404, "Unknown governance resource.")
    model, allowed = _RESOURCES[resource]; item = await db.get(model, item_id)
    if item is None or item.deleted_at is not None: raise HTTPException(404, "Record not found.")
    data = _clean(resource, payload.data, allowed); _enforce_publish(current_user, data)
    for key, value in data.items(): setattr(item, key, value)
    if resource == "documents" and item.status == PUBLISHED:
        if item.verification_status != "verified" or not item.is_public or not (item.file_key or item.external_url):
            raise HTTPException(422, "Publishing requires a verified public document with an uploaded file or external URL.")
    await AuditService(db).log(action="UPDATE", entity_type=f"governance_{resource}", entity_id=item.id, new_values={k: str(v) for k, v in data.items()}, request=request)
    await db.commit(); await db.refresh(item); return _row(item, private=True)

@router.delete("/admin/{resource}/{item_id}", response_model=MessageResponse, dependencies=[_manager()])
async def admin_delete(resource: str, item_id: uuid.UUID, request: Request, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):
    if resource not in _RESOURCES: raise HTTPException(404, "Unknown governance resource.")
    model, _ = _RESOURCES[resource]; item = await db.get(model, item_id)
    if item is None or item.deleted_at is not None: raise HTTPException(404, "Record not found.")
    if isinstance(item, GovernanceDocument) and (item.status == PUBLISHED or item.file_key):
        raise HTTPException(409, "Official document records must be archived or withdrawn, not deleted.")
    if current_user.role != UserRole.admin: raise HTTPException(403, "Only administrators can delete content.")
    item.deleted_at = datetime.now(timezone.utc)
    await AuditService(db).log(action="DELETE", entity_type=f"governance_{resource}", entity_id=item.id, request=request)
    await db.commit(); return MessageResponse(message="Record removed.")

@router.post("/admin/documents/{document_id}/file", dependencies=[_manager()])
async def upload_document(document_id: uuid.UUID, request: Request, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)], file: UploadFile = File(...), version: str = Query(..., min_length=1, max_length=40)):
    document = await db.get(GovernanceDocument, document_id)
    if document is None or document.deleted_at is not None: raise HTTPException(404, "Document not found.")
    content = await file.read()
    try: valid = validate_attachment_file(content, file.filename or "document")
    except FileValidationError as exc: raise HTTPException(422, str(exc)) from exc
    existing = await db.scalar(select(DocumentVersion.id).where(DocumentVersion.document_id == document.id, DocumentVersion.version == version))
    if existing: raise HTTPException(409, "This version already exists.")
    key = await storage.upload(valid.content, "governance-documents", file.filename or "document", valid.mime_type, public=False)
    await db.execute(update(DocumentVersion).where(DocumentVersion.document_id == document.id).values(is_current=False))
    checksum = hashlib.sha256(content).hexdigest()
    record = DocumentVersion(document_id=document.id, version=version, file_key=key, file_name=file.filename or "document", mime_type=valid.mime_type, file_size_bytes=valid.size_bytes, checksum=checksum, is_current=True, status="draft")
    db.add(record)
    document.file_key = key; document.file_name = record.file_name; document.mime_type = valid.mime_type
    document.file_extension = Path(record.file_name).suffix.lower().lstrip("."); document.file_size_bytes = valid.size_bytes
    document.checksum = checksum; document.version = version; document.external_url = None
    await AuditService(db).log(action="UPLOAD_VERSION", entity_type="governance_document", entity_id=document.id, new_values={"version": version, "file_name": record.file_name, "checksum": checksum}, request=request)
    await db.commit(); return {"message": "Document version uploaded.", "version": version}
