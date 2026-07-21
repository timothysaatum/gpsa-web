import uuid
from collections.abc import Generator
from datetime import UTC, datetime, timedelta

import jwt as pyjwt
import pytest
import structlog
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from app.core.config import settings
from app.core.dependencies import (
    _get_token_payload,
    get_current_user,
    get_current_user_optional,
    require_roles,
)
from app.core.security import create_access_token, create_refresh_token
from app.models.enums import UserRole
from app.models.user import User


@pytest.fixture(autouse=True)
def clear_structlog_context() -> Generator[None, None, None]:
    """Clear structlog context before and after each test."""
    structlog.contextvars.clear_contextvars()
    yield
    structlog.contextvars.clear_contextvars()


class TestGetTokenPayload:
    @pytest.mark.asyncio
    async def test_get_token_payload_no_credentials(self) -> None:
        with pytest.raises(HTTPException) as exc_info:
            await _get_token_payload(None)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Not authenticated"
        assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}

    @pytest.mark.asyncio
    async def test_get_token_payload_valid_token(self, test_student: User) -> None:
        token = create_access_token(test_student.id)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        payload = await _get_token_payload(credentials)
        assert payload["sub"] == str(test_student.id)
        assert payload["type"] == "access"

    @pytest.mark.asyncio
    async def test_get_token_payload_expired_token(self) -> None:
        # Create an expired token manually
        now = datetime.now(UTC)
        payload = {
            "sub": str(uuid.uuid4()),
            "iat": now - timedelta(hours=2),
            "exp": now - timedelta(hours=1),
            "type": "access",
        }
        token = pyjwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        with pytest.raises(HTTPException) as exc_info:
            await _get_token_payload(credentials)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Token has expired"
        assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}

    @pytest.mark.asyncio
    async def test_get_token_payload_invalid_token(self) -> None:
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials="invalid-token-string"
        )
        with pytest.raises(HTTPException) as exc_info:
            await _get_token_payload(credentials)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Invalid token"
        assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}

    @pytest.mark.asyncio
    async def test_get_token_payload_invalid_token_type(self, test_student: User) -> None:
        # Create a refresh token
        raw_refresh_token, _ = create_refresh_token(test_student.id)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=raw_refresh_token)

        with pytest.raises(HTTPException) as exc_info:
            await _get_token_payload(credentials)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Invalid token type"


class TestGetCurrentUser:
    @pytest.mark.asyncio
    async def test_get_current_user_success(
        self, db_session: AsyncSession, test_student: User
    ) -> None:
        request = Request(scope={"type": "http", "state": {}})
        payload = {"sub": str(test_student.id), "type": "access"}

        user = await get_current_user(request=request, payload=payload, db=db_session)
        assert user.id == test_student.id
        assert request.state.actor_id == test_student.id

        bound_vars = structlog.contextvars.get_contextvars()
        assert bound_vars["actor_id"] == str(test_student.id)
        assert bound_vars["role"] == test_student.role

    @pytest.mark.asyncio
    async def test_get_current_user_missing_sub(self, db_session: AsyncSession) -> None:
        request = Request(scope={"type": "http", "state": {}})
        payload = {"type": "access"}  # No sub

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request=request, payload=payload, db=db_session)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Invalid token subject"

    @pytest.mark.asyncio
    async def test_get_current_user_malformed_sub(self, db_session: AsyncSession) -> None:
        request = Request(scope={"type": "http", "state": {}})
        payload = {"sub": "not-a-uuid", "type": "access"}

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request=request, payload=payload, db=db_session)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Malformed token subject"

    @pytest.mark.asyncio
    async def test_get_current_user_not_found(self, db_session: AsyncSession) -> None:
        request = Request(scope={"type": "http", "state": {}})
        non_existent_id = uuid.uuid4()
        payload = {"sub": str(non_existent_id), "type": "access"}

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request=request, payload=payload, db=db_session)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "User not found"

    @pytest.mark.asyncio
    async def test_get_current_user_soft_deleted(
        self, db_session: AsyncSession, test_student: User
    ) -> None:
        request = Request(scope={"type": "http", "state": {}})
        payload = {"sub": str(test_student.id), "type": "access"}

        # Soft delete the student
        test_student.deleted_at = datetime.now(UTC)
        await db_session.flush()

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request=request, payload=payload, db=db_session)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "User not found"

    @pytest.mark.asyncio
    async def test_get_current_user_unverified_email(
        self, db_session: AsyncSession, test_student: User
    ) -> None:
        request = Request(scope={"type": "http", "state": {}})
        payload = {"sub": str(test_student.id), "type": "access"}

        # Mark email as unverified
        test_student.email_verified = False
        await db_session.flush()

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request=request, payload=payload, db=db_session)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Email address not verified" in exc_info.value.detail


class TestGetCurrentUserOptional:
    @pytest.mark.asyncio
    async def test_get_current_user_optional_no_credentials(self, db_session: AsyncSession) -> None:
        request = Request(scope={"type": "http", "state": {}})
        user = await get_current_user_optional(credentials=None, db=db_session, request=request)
        assert user is None

    @pytest.mark.asyncio
    async def test_get_current_user_optional_invalid_token(self, db_session: AsyncSession) -> None:
        request = Request(scope={"type": "http", "state": {}})
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid-token")
        user = await get_current_user_optional(
            credentials=credentials, db=db_session, request=request
        )
        assert user is None

    @pytest.mark.asyncio
    async def test_get_current_user_optional_wrong_type_token(
        self, db_session: AsyncSession, test_student: User
    ) -> None:
        request = Request(scope={"type": "http", "state": {}})
        raw_refresh_token, _ = create_refresh_token(test_student.id)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=raw_refresh_token)
        user = await get_current_user_optional(
            credentials=credentials, db=db_session, request=request
        )
        assert user is None

    @pytest.mark.asyncio
    async def test_get_current_user_optional_valid_user(
        self, db_session: AsyncSession, test_student: User
    ) -> None:
        request = Request(scope={"type": "http", "state": {}})
        token = create_access_token(test_student.id)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        user = await get_current_user_optional(
            credentials=credentials, db=db_session, request=request
        )
        assert user is not None
        assert user.id == test_student.id
        assert request.state.actor_id == test_student.id

        bound_vars = structlog.contextvars.get_contextvars()
        assert bound_vars["actor_id"] == str(test_student.id)
        assert bound_vars["role"] == test_student.role

    @pytest.mark.asyncio
    async def test_get_current_user_optional_deleted_user(
        self, db_session: AsyncSession, test_student: User
    ) -> None:
        request = Request(scope={"type": "http", "state": {}})
        token = create_access_token(test_student.id)
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        # Soft delete the student
        test_student.deleted_at = datetime.now(UTC)
        await db_session.flush()

        user = await get_current_user_optional(
            credentials=credentials, db=db_session, request=request
        )
        assert user is None


class TestRequireRoles:
    @pytest.mark.asyncio
    async def test_require_roles_authorized(self, test_student: User) -> None:
        checker = require_roles(UserRole.student, UserRole.exec)
        # test_student has role UserRole.student
        result = await checker(user=test_student)
        assert result == test_student

    @pytest.mark.asyncio
    async def test_require_roles_unauthorized(self, test_student: User) -> None:
        checker = require_roles(UserRole.admin)
        # test_student does not have role UserRole.admin
        with pytest.raises(HTTPException) as exc_info:
            await checker(user=test_student)
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert exc_info.value.detail == "You do not have permission to perform this action."
