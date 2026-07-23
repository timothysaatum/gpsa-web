"""
Integration tests for /api/v1/auth — runs against an in-memory SQLite DB.

Each test gets an isolated transaction, rolled back after the test.
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


BASE = "/api/v1/auth"

VALID_REGISTER = {
    "full_name": "Kofi Adu",
    "email": "kofi@test.com",
    "password": "Secure1234!",
    "level": 200,
}


# ── Registration ──────────────────────────────────────────────────────────────

class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        resp = await client.post(f"{BASE}/register", json=VALID_REGISTER)
        assert resp.status_code == 201
        body = resp.json()
        assert body["email"] == VALID_REGISTER["email"]
        assert body["email_verified"] is False
        assert "password_hash" not in body

    async def test_register_duplicate_email(self, client: AsyncClient):
        await client.post(f"{BASE}/register", json=VALID_REGISTER)
        resp = await client.post(f"{BASE}/register", json=VALID_REGISTER)
        assert resp.status_code == 409

    async def test_register_weak_password_no_uppercase(self, client: AsyncClient):
        payload = {**VALID_REGISTER, "email": "other@test.com", "password": "weak1234!"}
        resp = await client.post(f"{BASE}/register", json=payload)
        assert resp.status_code == 422

    async def test_register_weak_password_no_digit(self, client: AsyncClient):
        payload = {**VALID_REGISTER, "email": "other@test.com", "password": "WeakPass!"}
        resp = await client.post(f"{BASE}/register", json=payload)
        assert resp.status_code == 422

    async def test_register_invalid_level(self, client: AsyncClient):
        payload = {**VALID_REGISTER, "email": "other@test.com", "level": 250}
        resp = await client.post(f"{BASE}/register", json=payload)
        assert resp.status_code == 422

    async def test_register_invalid_email(self, client: AsyncClient):
        payload = {**VALID_REGISTER, "email": "not-an-email"}
        resp = await client.post(f"{BASE}/register", json=payload)
        assert resp.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────

class TestLogin:
    async def _register_and_verify(self, client: AsyncClient, db_session) -> None:
        """Helper — register then manually mark email verified."""
        from sqlalchemy import update

        from app.models.user import User

        await client.post(f"{BASE}/register", json=VALID_REGISTER)
        await db_session.execute(
            update(User)
            .where(User.email == VALID_REGISTER["email"])
            .values(email_verified=True)
        )
        await db_session.flush()

    async def test_login_unverified_email_blocked(self, client: AsyncClient):
        await client.post(f"{BASE}/register", json=VALID_REGISTER)
        resp = await client.post(
            f"{BASE}/login",
            json={"email": VALID_REGISTER["email"], "password": VALID_REGISTER["password"]},
        )
        assert resp.status_code == 403

    async def test_login_wrong_password(self, client: AsyncClient, db_session):
        await self._register_and_verify(client, db_session)
        resp = await client.post(
            f"{BASE}/login",
            json={"email": VALID_REGISTER["email"], "password": "WrongPass99!"},
        )
        assert resp.status_code == 401

    async def test_login_success_returns_tokens(self, client: AsyncClient, db_session):
        await self._register_and_verify(client, db_session)
        resp = await client.post(
            f"{BASE}/login",
            json={"email": VALID_REGISTER["email"], "password": VALID_REGISTER["password"]},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["token_type"] == "bearer"

    async def test_login_nonexistent_email(self, client: AsyncClient):
        resp = await client.post(
            f"{BASE}/login",
            json={"email": "nobody@test.com", "password": "Test1234!"},
        )
        assert resp.status_code == 401


# ── Get /me ───────────────────────────────────────────────────────────────────

class TestGetMe:
    async def test_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{BASE}/me")
        assert resp.status_code == 401

    async def test_me_authenticated(self, client: AsyncClient, student_token: str):
        resp = await client.get(
            f"{BASE}/me",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "student@test.com"


# ── Password reset ────────────────────────────────────────────────────────────

class TestForgotPassword:
    async def test_forgot_password_always_200(self, client: AsyncClient):
        """Must return 200 even for non-existent emails — prevents enumeration."""
        resp = await client.post(
            f"{BASE}/forgot-password",
            json={"email": "nobody@nowhere.com"},
        )
        assert resp.status_code == 200

    async def test_forgot_password_existing_user(self, client: AsyncClient, test_student):
        resp = await client.post(
            f"{BASE}/forgot-password",
            json={"email": test_student.email},
        )
        assert resp.status_code == 200


# ── Logout ────────────────────────────────────────────────────────────────────

class TestLogout:
    async def test_logout_requires_auth(self, client: AsyncClient):
        resp = await client.post(
            f"{BASE}/logout",
            json={"refresh_token": "fake"},
        )
        assert resp.status_code == 401

    async def test_change_password_requires_auth(self, client: AsyncClient):
        resp = await client.post(
            f"{BASE}/change-password",
            json={"current_password": "old", "new_password": "NewPass1!"},
        )
        assert resp.status_code == 401


# ── Health check (smoke test) ─────────────────────────────────────────────────

class TestHealth:
    async def test_health_ok(self, client: AsyncClient):
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json()["status"] in ("ok", "degraded")
