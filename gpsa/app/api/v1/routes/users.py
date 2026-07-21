import uuid
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.repositories.user import UserRepository
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.user import AdminUpdateUserRequest, UpdateProfileRequest, UserPublicResponse
from app.services.audit import AuditService

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["Users"])


# ── Profile ───────────────────────────────────────────────────────────────────


@router.get(
    "/me",
    response_model=UserPublicResponse,
    summary="Get my profile",
)
async def get_my_profile(current_user: CurrentUser) -> UserPublicResponse:
    return UserPublicResponse.model_validate(current_user)


@router.patch(
    "/me",
    response_model=UserPublicResponse,
    summary="Update my profile",
)
async def update_my_profile(
    payload: UpdateProfileRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserPublicResponse:
    repo = UserRepository(db)
    updates = payload.model_dump(exclude_none=True)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided to update.",
        )

    old_values = {k: getattr(current_user, k) for k in updates}
    user = await repo.update(current_user, updates)

    await AuditService(db).log(
        action="UPDATE",
        entity_type="user",
        entity_id=user.id,
        old_values=old_values,
        new_values=updates,
        request=request,
    )
    await db.commit()
    return UserPublicResponse.model_validate(user)


# ── Admin — user management ───────────────────────────────────────────────────


@router.get(
    "/",
    response_model=PaginatedResponse[UserPublicResponse],
    summary="List all users (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    offset: int = 0,
    limit: int = 20,
) -> PaginatedResponse[UserPublicResponse]:
    repo = UserRepository(db)
    users = await repo.list(offset=offset, limit=limit)
    total = await repo.count()
    return PaginatedResponse(
        items=[UserPublicResponse.model_validate(u) for u in users],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get(
    "/{user_id}",
    response_model=UserPublicResponse,
    summary="Get a user by ID (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def get_user(
    user_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserPublicResponse:
    user = await UserRepository(db).get_by_id_or_404(user_id)
    return UserPublicResponse.model_validate(user)


@router.patch(
    "/{user_id}",
    response_model=UserPublicResponse,
    summary="Update a user's role or active status (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def admin_update_user(
    user_id: uuid.UUID,
    payload: AdminUpdateUserRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserPublicResponse:
    from datetime import UTC, datetime

    repo = UserRepository(db)
    user = await repo.get_by_id_or_404(user_id)

    updates: dict = {}
    if payload.role is not None:
        updates["role"] = payload.role
    if payload.is_active is not None:
        updates["deleted_at"] = None if payload.is_active else datetime.now(UTC)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No fields provided.",
        )

    old_values = {k: str(getattr(user, k)) for k in updates}
    user = await repo.update(user, updates)

    await AuditService(db).log(
        action="UPDATE",
        entity_type="user",
        entity_id=user.id,
        old_values=old_values,
        new_values={k: str(v) for k, v in updates.items()},
        request=request,
        actor_id=current_user.id,
    )
    await db.commit()
    return UserPublicResponse.model_validate(user)


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    summary="Soft-delete a user (admin only)",
    dependencies=[Depends(require_roles(UserRole.admin))],
)
async def delete_user(
    user_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )

    repo = UserRepository(db)
    user = await repo.get_by_id_or_404(user_id)
    await repo.soft_delete(user)

    await AuditService(db).log(
        action="DELETE",
        entity_type="user",
        entity_id=user.id,
        old_values={"email": user.email, "role": user.role},
        request=request,
        actor_id=current_user.id,
    )
    await db.commit()
    logger.info("user_soft_deleted", target_id=str(user_id), by=str(current_user.id))
    return MessageResponse(message="User account has been deactivated.")
