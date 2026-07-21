"""Unit tests for app.core.security — no DB required."""

import uuid

import jwt
import pytest

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_secure_token,
    hash_password,
    hash_token,
    needs_rehash,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        plain = "MySecret1!"
        assert hash_password(plain) != plain

    def test_verify_correct_password(self):
        plain = "MySecret1!"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_reject_wrong_password(self):
        hashed = hash_password("MySecret1!")
        assert verify_password("WrongPass1!", hashed) is False

    def test_two_hashes_of_same_password_differ(self):
        """Argon2 uses a random salt — two hashes must never be equal."""
        plain = "MySecret1!"
        assert hash_password(plain) != hash_password(plain)

    def test_argon2_hash_prefix(self):
        hashed = hash_password("MySecret1!")
        assert hashed.startswith("$argon2")

    def test_new_hash_does_not_need_rehash(self):
        hashed = hash_password("MySecret1!")
        assert needs_rehash(hashed) is False


class TestJWT:
    def test_access_token_encodes_subject(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id)
        payload = decode_token(token)
        assert payload["sub"] == str(user_id)

    def test_access_token_type_is_access(self):
        token = create_access_token(uuid.uuid4())
        assert decode_token(token)["type"] == "access"

    def test_refresh_token_type_is_refresh(self):
        raw, _ = create_refresh_token(uuid.uuid4())
        assert decode_token(raw)["type"] == "refresh"

    def test_expired_token_raises(self):
        from datetime import UTC, datetime, timedelta

        import jwt as _jwt

        from app.core.config import settings

        now = datetime.now(UTC)
        payload = {
            "sub": str(uuid.uuid4()),
            "iat": now - timedelta(hours=2),
            "exp": now - timedelta(hours=1),
            "type": "access",
        }
        expired = _jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        with pytest.raises(_jwt.ExpiredSignatureError):
            decode_token(expired)

    def test_tampered_token_raises(self):
        token = create_access_token(uuid.uuid4())
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(jwt.InvalidTokenError):
            decode_token(tampered)

    def test_extra_claims_included(self):
        token = create_access_token(uuid.uuid4(), extra={"role": "admin"})
        payload = decode_token(token)
        assert payload["role"] == "admin"


class TestSecureTokens:
    def test_generate_secure_token_is_url_safe(self):
        token = generate_secure_token()
        assert all(
            c in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=" for c in token
        )

    def test_generate_secure_token_unique(self):
        tokens = {generate_secure_token() for _ in range(100)}
        assert len(tokens) == 100

    def test_hash_token_is_deterministic(self):
        raw = generate_secure_token()
        assert hash_token(raw) == hash_token(raw)

    def test_hash_token_different_inputs_differ(self):
        assert hash_token("abc") != hash_token("xyz")

    def test_hash_token_is_64_chars(self):
        """SHA-256 hex digest is always 64 characters."""
        assert len(hash_token(generate_secure_token())) == 64
