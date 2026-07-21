from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.db.session import get_db
from app.schemas.common import MessageResponse
from app.schemas.user import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserPublicResponse,
    UserRegisterRequest,
    VerifyEmailRequest,
)
from app.services.auth import AuthService

router = APIRouter(tags=["Auth"])


@router.post(
    "/register",
    response_model=UserPublicResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student account",
)
async def register(
    payload: UserRegisterRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserPublicResponse:
    """
    Create a new student account.

    - Sends an email verification link to the provided address.
    - Account is not active until the email is verified.
    """
    return await AuthService(db).register(payload, request)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive access + refresh tokens",
)
async def login(
    payload: LoginRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """
    Authenticate with email and password.

    Returns a short-lived JWT access token and a long-lived refresh token.
    After `{access_token_expire_minutes}` minutes, use `/auth/refresh` to rotate.

    Rate-limited: account locks after 5 consecutive failures.
    """
    return await AuthService(db).login(payload, request)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate access + refresh token pair",
)
async def refresh(
    payload: RefreshRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """
    Exchange a valid refresh token for a fresh access + refresh token pair.

    The old refresh token is immediately revoked (token rotation).
    Store the new refresh token in place of the old one.
    """
    return await AuthService(db).refresh_tokens_pair(payload, request)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout from current device",
)
async def logout(
    payload: RefreshRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Revoke the provided refresh token (current device only)."""
    await AuthService(db).logout(payload.refresh_token, request, current_user.id)
    return MessageResponse(message="Logged out successfully.")


@router.post(
    "/logout-all",
    response_model=MessageResponse,
    summary="Logout from all devices",
)
async def logout_all(
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Revoke all refresh tokens for the current user (all devices)."""
    await AuthService(db).logout_all(current_user.id, request)
    return MessageResponse(message="Logged out from all devices.")


@router.post(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify email address",
)
async def verify_email(
    payload: VerifyEmailRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Activate account using the token from the verification email."""
    await AuthService(db).verify_email(payload, request)
    return MessageResponse(message="Email verified successfully. You can now log in.")


@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    summary="Resend email verification link",
)
async def resend_verification(
    payload: ForgotPasswordRequest,  # reuses {email} field
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """
    Resend the verification email.
    Always returns 200 regardless of whether the email exists.
    """
    await AuthService(db).resend_verification(payload.email, request)
    return MessageResponse(
        message="If that email is registered and unverified, a new link has been sent."
    )


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password reset link",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """
    Send a password reset link to the provided email.
    Always returns 200 to prevent email enumeration.
    """
    await AuthService(db).forgot_password(payload, request)
    return MessageResponse(message="If that email is registered, a reset link has been sent.")


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using token from email",
)
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """
    Set a new password using the token from the reset email.
    All active sessions are revoked after a successful reset.
    """
    await AuthService(db).reset_password(payload, request)
    return MessageResponse(
        message="Password reset successfully. Please log in with your new password."
    )


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change password (authenticated)",
)
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """
    Change password while logged in. Requires current password for confirmation.
    All active sessions are revoked after success.
    """
    await AuthService(db).change_password(current_user.id, payload, request)
    return MessageResponse(message="Password changed successfully. Please log in again.")


@router.get(
    "/me",
    response_model=UserPublicResponse,
    summary="Get current authenticated user",
)
async def get_me(current_user: CurrentUser) -> UserPublicResponse:
    """Return the profile of the currently authenticated user."""
    return UserPublicResponse.model_validate(current_user)
