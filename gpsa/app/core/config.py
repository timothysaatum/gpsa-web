from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, EmailStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ───────────────────────────────────────────────────────────
    app_name: str = "GPSA-UDS Website API"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str
    database_pool_size: int = 10
    database_max_overflow: int = 20
    database_pool_timeout: int = 30

    # ── JWT ───────────────────────────────────────────────────────────────────
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    # ── Security ──────────────────────────────────────────────────────────────
    max_login_attempts: int = 5
    lockout_duration_minutes: int = 10
    password_reset_token_expire_hours: int = 1
    email_verification_token_expire_hours: int = 24

    # ── Object Storage ────────────────────────────────────────────────────────
    storage_endpoint_url: str
    storage_access_key_id: str
    storage_secret_access_key: str
    storage_bucket_name: str
    storage_public_url: str  # CDN base URL for public file access

    # ── Email ─────────────────────────────────────────────────────────────────
    resend_api_key: str
    email_from_address: EmailStr = "noreply@gpsa-uds.edu.gh"  # type: ignore[assignment]
    email_from_name: str = "GPSA-UDS"

    # ── Seed ──────────────────────────────────────────────────────────────────
    first_admin_email: EmailStr = "admin@gpsa-uds.edu.gh"  # type: ignore[assignment]
    first_admin_password: str = "change-me-immediately"

    # ── Computed ──────────────────────────────────────────────────────────────
    @field_validator("jwt_secret_key")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
        return v

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError("DATABASE_URL must use postgresql+asyncpg:// scheme for async support")
        return v

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings: Settings = get_settings()
