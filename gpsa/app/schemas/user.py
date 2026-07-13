import uuid
from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from app.models.enums import UserRole
from app.schemas.common import AppModel


# ── Registration ──────────────────────────────────────────────────────────────

class UserRegisterRequest(AppModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = Field(default=None, max_length=20)
    student_id: str | None = Field(default=None, max_length=50)
    level: int | None = Field(default=None, ge=100, le=600)

    @field_validator("level")
    @classmethod
    def validate_level(cls, v: int | None) -> int | None:
        if v is not None and v % 100 != 0:
            raise ValueError("Level must be a multiple of 100 (100, 200, ..., 600)")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(AppModel):
    email: EmailStr
    password: str


class TokenResponse(AppModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # access token TTL in seconds


class RefreshRequest(AppModel):
    refresh_token: str


# ── Password management ───────────────────────────────────────────────────────

class ForgotPasswordRequest(AppModel):
    email: EmailStr


class ResetPasswordRequest(AppModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class ChangePasswordRequest(AppModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


# ── Email verification ────────────────────────────────────────────────────────

class VerifyEmailRequest(AppModel):
    token: str


# ── User responses ────────────────────────────────────────────────────────────

class UserPublicResponse(AppModel):
    """Safe read — never exposes auth internals."""
    id: uuid.UUID
    full_name: str
    email: str
    phone: str | None
    student_id: str | None
    level: int | None
    role: UserRole
    email_verified: bool
    created_at: datetime


class UserSummaryResponse(AppModel):
    """Compact form used in nested objects (e.g. event registration, news author)."""
    id: uuid.UUID
    full_name: str
    role: UserRole


# ── Profile update ────────────────────────────────────────────────────────────

class UpdateProfileRequest(AppModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    student_id: str | None = Field(default=None, max_length=50)
    level: int | None = Field(default=None, ge=100, le=600)

    @field_validator("level")
    @classmethod
    def validate_level(cls, v: int | None) -> int | None:
        if v is not None and v % 100 != 0:
            raise ValueError("Level must be a multiple of 100")
        return v


# ── Admin user management ─────────────────────────────────────────────────────

class AdminUpdateUserRequest(AppModel):
    role: UserRole | None = None
    is_active: bool | None = None  # maps to deleted_at in service layer
