"""
Auth service — all authentication business logic lives here.

Responsibilities:
  - User registration with email verification
  - Login with brute-force protection
  - JWT access + refresh token issuance and rotation
  - Logout (single device + all devices)
  - Email verification
  - Password reset (forgot + reset)
  - Password change (authenticated)

The service layer coordinates repositories, security utils,
email service, and audit service. Routes stay thin.
"""

import uuid
from datetime import UTC, datetime, timedelta

import structlog
from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_secure_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.enums import EmailTemplate, UserRole
from app.repositories.user import (
    PasswordResetTokenRepository,
    RefreshTokenRepository,
    UserRepository,
)
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
from app.services.audit import AuditService
from app.services.email import EmailService

logger = structlog.get_logger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.refresh_tokens = RefreshTokenRepository(db)
        self.reset_tokens = PasswordResetTokenRepository(db)
        self.audit = AuditService(db)
        self.email = EmailService(db)

    # ── Registration ──────────────────────────────────────────────────────────

    async def register(
        self, payload: UserRegisterRequest, request: Request
    ) -> UserPublicResponse:
        # Uniqueness checks
        if await self.users.get_by_email(payload.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )
        if payload.student_id and await self.users.get_by_student_id(payload.student_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This student ID is already registered.",
            )

        # Generate verification token — store only the hash
        raw_token = generate_secure_token()
        token_hash = hash_token(raw_token)

        user = await self.users.create({
            "full_name": payload.full_name.strip(),
            "email": payload.email.lower().strip(),
            "password_hash": hash_password(payload.password),
            "phone": payload.phone,
            "student_id": payload.student_id,
            "level": payload.level,
            "role": UserRole.student,
            "email_verified": False,
            "verification_token": token_hash,
            "verification_sent_at": datetime.now(UTC),
        })

        # Send verification email (raw token — never the hash)
        await self.email.send_verification_email(user.email, user.full_name, raw_token)

        await self.audit.log(
            action="CREATE",
            entity_type="user",
            entity_id=user.id,
            new_values={"email": user.email, "role": user.role},
            request=request,
            actor_id=user.id,
        )

        await self.db.commit()
        logger.info("user_registered", user_id=str(user.id), email=user.email)
        return UserPublicResponse.model_validate(user)

    # ── Login ─────────────────────────────────────────────────────────────────

    async def login(self, payload: LoginRequest, request: Request) -> TokenResponse:
        user = await self.users.get_by_email(payload.email)

        # Constant-time failure path — do not reveal whether email exists
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        # Account lockout check
        if user.locked_until and user.locked_until > datetime.now(UTC):
            remaining = int((user.locked_until - datetime.now(UTC)).total_seconds() / 60)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account locked. Try again in {remaining} minute(s).",
            )

        if not verify_password(payload.password, user.password_hash):
            await self.users.record_failed_login(user)

            if user.failed_login_attempts + 1 >= settings.max_login_attempts:
                locked_until = datetime.now(UTC) + timedelta(
                    minutes=settings.lockout_duration_minutes
                )
                await self.users.lock_account(user, locked_until)
                await self.audit.log(
                    action="ACCOUNT_LOCKED",
                    entity_type="user",
                    entity_id=user.id,
                    new_values={"locked_until": locked_until.isoformat()},
                    request=request,
                )
                await self.db.commit()
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=(
                        f"Too many failed attempts. Account locked for "
                        f"{settings.lockout_duration_minutes} minutes."
                    ),
                )

            await self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before logging in.",
            )

        if user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated.",
            )

        # Issue tokens
        access_token = create_access_token(user.id, extra={"role": user.role})
        raw_refresh, expires_at = create_refresh_token(user.id)

        await self.refresh_tokens.create({
            "user_id": user.id,
            "token_hash": hash_token(raw_refresh),
            "expires_at": expires_at,
            "device_info": request.state.user_agent,
            "ip_address": request.state.ip_address,
            "created_at": datetime.now(UTC),
        })

        await self.users.record_login(user)
        await self.audit.log(
            action="LOGIN",
            entity_type="user",
            entity_id=user.id,
            request=request,
        )
        await self.db.commit()

        logger.info("user_logged_in", user_id=str(user.id))
        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=settings.access_token_expire_minutes * 60,
        )

    # ── Token refresh ─────────────────────────────────────────────────────────

    async def refresh_tokens_pair(
        self, payload: RefreshRequest, request: Request
    ) -> TokenResponse:
        token_hash = hash_token(payload.refresh_token)
        stored = await self.refresh_tokens.get_by_hash(token_hash)

        if stored is None or stored.expires_at < datetime.now(UTC):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is invalid or has expired. Please log in again.",
            )

        user = await self.users.get_by_id(stored.user_id)
        if user is None or user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account not found.",
            )

        # Rotate — revoke old, issue new pair
        await self.refresh_tokens.revoke(stored)

        access_token = create_access_token(user.id, extra={"role": user.role})
        raw_refresh, expires_at = create_refresh_token(user.id)

        await self.refresh_tokens.create({
            "user_id": user.id,
            "token_hash": hash_token(raw_refresh),
            "expires_at": expires_at,
            "device_info": request.state.user_agent,
            "ip_address": request.state.ip_address,
            "created_at": datetime.now(UTC),
        })

        await self.db.commit()
        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=settings.access_token_expire_minutes * 60,
        )

    # ── Logout ────────────────────────────────────────────────────────────────

    async def logout(
        self, raw_refresh_token: str, request: Request, user_id: uuid.UUID
    ) -> None:
        token_hash = hash_token(raw_refresh_token)
        stored = await self.refresh_tokens.get_by_hash(token_hash)
        if stored:
            await self.refresh_tokens.revoke(stored)

        await self.audit.log(
            action="LOGOUT",
            entity_type="user",
            entity_id=user_id,
            request=request,
        )
        await self.db.commit()

    async def logout_all(self, user_id: uuid.UUID, request: Request) -> None:
        count = await self.refresh_tokens.revoke_all_for_user(user_id)
        await self.audit.log(
            action="LOGOUT_ALL",
            entity_type="user",
            entity_id=user_id,
            new_values={"revoked_tokens": count},
            request=request,
        )
        await self.db.commit()
        logger.info("user_logged_out_all_devices", user_id=str(user_id), revoked=count)

    # ── Email verification ────────────────────────────────────────────────────

    async def verify_email(self, payload: VerifyEmailRequest, request: Request) -> None:
        token_hash = hash_token(payload.token)
        user = await self.users.get_by_verification_token(token_hash)

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification link is invalid or has already been used.",
            )

        if user.verification_sent_at:
            expire_hours = settings.email_verification_token_expire_hours
            expiry = user.verification_sent_at + timedelta(hours=expire_hours)
            if datetime.now(UTC) > expiry:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Verification link has expired. Please request a new one.",
                )

        await self.users.mark_email_verified(user)
        await self.audit.log(
            action="EMAIL_VERIFIED",
            entity_type="user",
            entity_id=user.id,
            request=request,
        )
        await self.db.commit()
        logger.info("email_verified", user_id=str(user.id))

    async def resend_verification(self, email: str, request: Request) -> None:
        """Rate-limited resend — silently no-ops if email not found (security)."""
        user = await self.users.get_by_email(email)
        if not user or user.email_verified:
            return  # silent — do not reveal account existence

        raw_token = generate_secure_token()
        await self.users.update(user, {
            "verification_token": hash_token(raw_token),
            "verification_sent_at": datetime.now(UTC),
        })
        await self.email.send_verification_email(user.email, user.full_name, raw_token)
        await self.db.commit()

    # ── Password reset ────────────────────────────────────────────────────────

    async def forgot_password(
        self, payload: ForgotPasswordRequest, request: Request
    ) -> None:
        """Always returns 200 regardless of outcome — prevents email enumeration."""
        user = await self.users.get_by_email(payload.email)
        if not user or not user.email_verified:
            return

        # Invalidate any existing tokens before creating a new one
        await self.reset_tokens.invalidate_existing_for_user(user.id)

        raw_token = generate_secure_token()
        expires_at = datetime.now(UTC) + timedelta(
            hours=settings.password_reset_token_expire_hours
        )
        await self.reset_tokens.create({
            "user_id": user.id,
            "token_hash": hash_token(raw_token),
            "expires_at": expires_at,
            "ip_address": request.state.ip_address,
            "created_at": datetime.now(UTC),
        })

        await self.email.send_password_reset_email(user.email, user.full_name, raw_token)
        await self.audit.log(
            action="PASSWORD_RESET_REQUESTED",
            entity_type="user",
            entity_id=user.id,
            request=request,
        )
        await self.db.commit()

    async def reset_password(
        self, payload: ResetPasswordRequest, request: Request
    ) -> None:
        token_hash = hash_token(payload.token)
        reset_token = await self.reset_tokens.get_valid_by_hash(token_hash)

        if reset_token is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset link is invalid or has expired.",
            )

        user = await self.users.get_by_id(reset_token.user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found.")

        await self.users.update_password(user, hash_password(payload.new_password))
        await self.reset_tokens.mark_used(reset_token)

        # Revoke all active sessions after password reset
        await self.refresh_tokens.revoke_all_for_user(user.id)

        await self.audit.log(
            action="PASSWORD_RESET",
            entity_type="user",
            entity_id=user.id,
            request=request,
        )
        await self.db.commit()
        logger.info("password_reset_completed", user_id=str(user.id))

    # ── Change password (authenticated) ──────────────────────────────────────

    async def change_password(
        self,
        user_id: uuid.UUID,
        payload: ChangePasswordRequest,
        request: Request,
    ) -> None:
        user = await self.users.get_by_id_or_404(user_id)

        if not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

        if verify_password(payload.new_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from your current password.",
            )

        await self.users.update_password(user, hash_password(payload.new_password))
        await self.refresh_tokens.revoke_all_for_user(user.id)

        await self.audit.log(
            action="PASSWORD_CHANGED",
            entity_type="user",
            entity_id=user.id,
            request=request,
        )
        await self.db.commit()
        logger.info("password_changed", user_id=str(user.id))
