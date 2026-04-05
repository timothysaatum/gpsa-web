import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── Password hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────
def _encode(payload: dict[str, Any]) -> str:
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _decode(token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )


def create_access_token(subject: str | uuid.UUID, extra: dict[str, Any] | None = None) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
        "type": "access",
    }
    if extra:
        payload.update(extra)
    return _encode(payload)


def create_refresh_token(subject: str | uuid.UUID) -> tuple[str, datetime]:
    """Returns (raw_token, expires_at). Store hash of raw_token in DB."""
    now = datetime.now(UTC)
    expires_at = now + timedelta(days=settings.refresh_token_expire_days)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": expires_at,
        "type": "refresh",
        "jti": str(uuid.uuid4()),  # unique per token for revocation
    }
    return _encode(payload), expires_at


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT.

    Raises jwt.PyJWTError subclasses on failure — callers should handle:
      - jwt.ExpiredSignatureError
      - jwt.InvalidTokenError
    """
    return _decode(token)


# ── Secure random tokens ──────────────────────────────────────────────────────
def generate_secure_token(nbytes: int = 32) -> str:
    """Generate a URL-safe random token (for email verification / password reset)."""
    return secrets.token_urlsafe(nbytes)


def hash_token(raw: str) -> str:
    """Store only the hash of sensitive tokens (verification, reset, refresh)."""
    import hashlib

    return hashlib.sha256(raw.encode()).hexdigest()
