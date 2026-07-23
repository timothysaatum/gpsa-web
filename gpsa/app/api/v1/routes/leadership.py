import uuid
from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.leadership import Leader, LeadershipTerm
from app.repositories.base import BaseRepository
from app.schemas.common import AppModel, MessageResponse
from app.services.audit import AuditService
from app.services.storage import storage
from app.utils.file_validation import validate_image_file


class PublicLeaderResponse(AppModel):
    id: uuid.UUID
    term_id: uuid.UUID
    full_name: str
    office: str
    bio: str | None
    photo_url: str | None
    sort_order: int


class LeaderResponse(PublicLeaderResponse):
    id: uuid.UUID
    term_id: uuid.UUID
    full_name: str
    office: str
    bio: str | None
    email: str | None
    phone: str | None
    photo_url: str | None
    sort_order: int
    is_active: bool
    created_at: datetime


class LeadershipTermResponse(AppModel):
    id: uuid.UUID
    title: str
    academic_year: str
    start_date: date | None
    end_date: date | None
    theme: str | None
    summary: str | None
    is_current: bool
    sort_order: int
    created_at: datetime
    leaders: list[LeaderResponse] = []


class PublicLeadershipTermResponse(AppModel):
    id: uuid.UUID
    title: str
    academic_year: str
    start_date: date | None
    end_date: date | None
    theme: str | None
    summary: str | None
    leaders: list[PublicLeaderResponse] = []


class LeadershipTermCreateRequest(AppModel):
    title: str
    academic_year: str
    start_date: date | None = None
    end_date: date | None = None
    theme: str | None = None
    summary: str | None = None
    is_current: bool = False
    sort_order: int = 0


class LeadershipTermUpdateRequest(AppModel):
    title: str | None = None
    academic_year: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    theme: str | None = None
    summary: str | None = None
    is_current: bool | None = None
    sort_order: int | None = None


class LeaderCreateRequest(AppModel):
    term_id: uuid.UUID
    full_name: str
    office: str
    bio: str | None = None
    email: str | None = None
    phone: str | None = None
    photo_url: str | None = None
    sort_order: int = 0
    is_active: bool = True


class LeaderUpdateRequest(AppModel):
    term_id: uuid.UUID | None = None
    full_name: str | None = None
    office: str | None = None
    bio: str | None = None
    email: str | None = None
    phone: str | None = None
    photo_url: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


router = APIRouter(tags=["Leadership"])


def _manager_dependency():
    return Depends(require_roles(UserRole.exec, UserRole.admin))


async def _unset_other_current_terms(db: AsyncSession, term_id: uuid.UUID | None = None) -> None:
    stmt = update(LeadershipTerm).where(
        LeadershipTerm.deleted_at.is_(None),
        LeadershipTerm.is_current.is_(True),
    )
    if term_id is not None:
        stmt = stmt.where(LeadershipTerm.id != term_id)
    await db.execute(stmt.values(is_current=False))


async def _get_term_or_404(db: AsyncSession, term_id: uuid.UUID) -> LeadershipTerm:
    result = await db.execute(
        select(LeadershipTerm)
        .options(selectinload(LeadershipTerm.leaders))
        .where(LeadershipTerm.id == term_id, LeadershipTerm.deleted_at.is_(None))
    )
    term = result.scalar_one_or_none()
    if term is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leadership term not found.")
    return term


@router.get("/", response_model=list[PublicLeadershipTermResponse], summary="List published leadership terms")
async def list_terms(
    db: Annotated[AsyncSession, Depends(get_db)],
    offset: int = 0,
    limit: int = 50,
) -> list[PublicLeadershipTermResponse]:
    q = (
        select(LeadershipTerm)
        .options(selectinload(LeadershipTerm.leaders))
        .where(LeadershipTerm.deleted_at.is_(None))
        .order_by(LeadershipTerm.is_current.desc(), LeadershipTerm.sort_order.asc(), LeadershipTerm.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(q)
    terms = list(result.scalars().unique().all())
    for term in terms:
        term.leaders = [leader for leader in term.leaders if leader.deleted_at is None and leader.is_active]
    return [PublicLeadershipTermResponse.model_validate(term) for term in terms]


@router.get("/admin", response_model=list[LeadershipTermResponse], summary="List all leadership records", dependencies=[_manager_dependency()])
async def list_admin_terms(
    db: Annotated[AsyncSession, Depends(get_db)],
    offset: int = 0,
    limit: int = 100,
) -> list[LeadershipTermResponse]:
    result = await db.execute(
        select(LeadershipTerm)
        .options(selectinload(LeadershipTerm.leaders))
        .where(LeadershipTerm.deleted_at.is_(None))
        .order_by(LeadershipTerm.is_current.desc(), LeadershipTerm.sort_order.asc())
        .offset(offset)
        .limit(min(limit, 200))
    )
    return [LeadershipTermResponse.model_validate(term) for term in result.scalars().unique().all()]


@router.get("/current", response_model=PublicLeadershipTermResponse | None, summary="Get current leadership")
async def get_current_leadership(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PublicLeadershipTermResponse | None:
    result = await db.execute(
        select(LeadershipTerm)
        .options(selectinload(LeadershipTerm.leaders))
        .where(
            LeadershipTerm.deleted_at.is_(None),
            LeadershipTerm.is_current.is_(True),
        )
        .order_by(LeadershipTerm.sort_order.asc(), LeadershipTerm.created_at.desc())
        .limit(1)
    )
    term = result.scalar_one_or_none()
    if term is None:
        return None
    term.leaders = [leader for leader in term.leaders if leader.deleted_at is None and leader.is_active]
    return PublicLeadershipTermResponse.model_validate(term)


@router.post(
    "/terms",
    response_model=LeadershipTermResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a leadership term",
    dependencies=[_manager_dependency()],
)
async def create_term(
    payload: LeadershipTermCreateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LeadershipTermResponse:
    if payload.is_current:
        await _unset_other_current_terms(db)
    term = await BaseRepository(LeadershipTerm, db).create(payload.model_dump())
    await AuditService(db).log(
        action="CREATE",
        entity_type="leadership_term",
        entity_id=term.id,
        new_values={"title": term.title, "academic_year": term.academic_year},
        request=request,
    )
    await db.commit()
    return LeadershipTermResponse.model_validate(term)


@router.patch(
    "/terms/{term_id}",
    response_model=LeadershipTermResponse,
    summary="Update a leadership term",
    dependencies=[_manager_dependency()],
)
async def update_term(
    term_id: uuid.UUID,
    payload: LeadershipTermUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LeadershipTermResponse:
    term = await _get_term_or_404(db, term_id)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    if updates.get("is_current") is True:
        await _unset_other_current_terms(db, term.id)
    term = await BaseRepository(LeadershipTerm, db).update(term, updates)
    await AuditService(db).log(
        action="UPDATE",
        entity_type="leadership_term",
        entity_id=term.id,
        new_values={k: str(v) for k, v in updates.items()},
        request=request,
    )
    await db.commit()
    return LeadershipTermResponse.model_validate(term)


@router.delete(
    "/terms/{term_id}",
    response_model=MessageResponse,
    summary="Delete a leadership term",
    dependencies=[_manager_dependency()],
)
async def delete_term(
    term_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    term = await _get_term_or_404(db, term_id)
    if term.is_current:
        raise HTTPException(status_code=409, detail="Set another administration as current before deleting this term.")
    await BaseRepository(LeadershipTerm, db).soft_delete(term)
    await AuditService(db).log(action="DELETE", entity_type="leadership_term", entity_id=term.id, request=request)
    await db.commit()
    return MessageResponse(message="Leadership term deleted.")


@router.post(
    "/leaders",
    response_model=LeaderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a leader record",
    dependencies=[_manager_dependency()],
)
async def create_leader(
    payload: LeaderCreateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LeaderResponse:
    await _get_term_or_404(db, payload.term_id)
    leader = await BaseRepository(Leader, db).create(payload.model_dump())
    await AuditService(db).log(
        action="CREATE",
        entity_type="leader",
        entity_id=leader.id,
        new_values={"full_name": leader.full_name, "office": leader.office},
        request=request,
    )
    await db.commit()
    return LeaderResponse.model_validate(leader)


@router.patch(
    "/leaders/{leader_id}",
    response_model=LeaderResponse,
    summary="Update a leader record",
    dependencies=[_manager_dependency()],
)
async def update_leader(
    leader_id: uuid.UUID,
    payload: LeaderUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LeaderResponse:
    repo = BaseRepository(Leader, db)
    leader = await repo.get_by_id_or_404(leader_id)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    if "term_id" in updates:
        await _get_term_or_404(db, updates["term_id"])
    leader = await repo.update(leader, updates)
    await AuditService(db).log(
        action="UPDATE",
        entity_type="leader",
        entity_id=leader.id,
        new_values={k: str(v) for k, v in updates.items()},
        request=request,
    )
    await db.commit()
    return LeaderResponse.model_validate(leader)


@router.post(
    "/leaders/{leader_id}/photo",
    response_model=LeaderResponse,
    summary="Upload a leader photo",
    dependencies=[_manager_dependency()],
)
async def upload_leader_photo(
    leader_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(..., description="Leader photo (JPEG, PNG, WebP)"),
) -> LeaderResponse:
    repo = BaseRepository(Leader, db)
    leader = await repo.get_by_id_or_404(leader_id)
    content = await file.read()
    validated = validate_image_file(content, file.filename or "leader.jpg")
    photo_key = await storage.upload(
        content=validated.content,
        folder="leadership",
        filename=file.filename or "leader.jpg",
        mime_type=validated.mime_type,
        public=True,
    )
    leader = await repo.update(leader, {"photo_key": photo_key, "photo_url": storage.cdn_url(photo_key)})
    await AuditService(db).log(
        action="UPLOAD_PHOTO",
        entity_type="leader",
        entity_id=leader.id,
        new_values={"photo_key": photo_key},
        request=request,
    )
    await db.commit()
    return LeaderResponse.model_validate(leader)


@router.delete(
    "/leaders/{leader_id}",
    response_model=MessageResponse,
    summary="Delete a leader record",
    dependencies=[_manager_dependency()],
)
async def delete_leader(
    leader_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    repo = BaseRepository(Leader, db)
    leader = await repo.get_by_id_or_404(leader_id)
    await repo.soft_delete(leader)
    await AuditService(db).log(action="DELETE", entity_type="leader", entity_id=leader.id, request=request)
    await db.commit()
    return MessageResponse(message="Leader deleted.")
