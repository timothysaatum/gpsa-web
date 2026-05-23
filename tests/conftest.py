"""
Shared pytest fixtures for unit and integration tests.

Integration tests spin up a real async SQLite DB (not Postgres)
so they run without a running DB server in CI.

To run against real Postgres, set TEST_DATABASE_URL in your environment.
"""

import asyncio
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.models  # noqa: F401 — register all models
from app.db.base import Base
from app.db.session import get_db

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


# ── Async engine & session ────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    """Single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """
    Each test gets a fresh session. Route handlers are allowed to commit,
    so the in-memory schema is reset after each test for isolation.
    """
    factory = async_sessionmaker(bind=test_engine, expire_on_commit=False)
    async with factory() as session:
        try:
            yield session
        finally:
            await session.rollback()
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


# ── FastAPI test client ───────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """HTTP test client wired to the test DB session."""
    from app.main import create_app

    app = create_app()

    # Override the DB dependency to use the test session
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


# ── Common data fixtures ──────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def test_student(db_session: AsyncSession):
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.models.user import User

    existing = await db_session.scalar(select(User).where(User.email == "student@test.com"))
    if existing:
        return existing

    user = User(
        full_name="Test Student",
        email="student@test.com",
        password_hash=hash_password("Test1234!"),
        role=UserRole.student,
        email_verified=True,
        level=300,
        student_id="TEST001",
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def test_admin(db_session: AsyncSession):
    from app.core.security import hash_password
    from app.models.enums import UserRole
    from app.models.user import User

    existing = await db_session.scalar(select(User).where(User.email == "admin@test.com"))
    if existing:
        return existing

    user = User(
        full_name="Test Admin",
        email="admin@test.com",
        password_hash=hash_password("Admin1234!"),
        role=UserRole.admin,
        email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def student_token(test_student) -> str:
    from app.core.security import create_access_token
    return create_access_token(test_student.id, extra={"role": test_student.role})


@pytest_asyncio.fixture
async def admin_token(test_admin) -> str:
    from app.core.security import create_access_token
    return create_access_token(test_admin.id, extra={"role": test_admin.role})


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
