import base64
from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routes import news as news_routes
from app.models.enums import NewsCategory
from app.models.news import NewsPost
from tests.conftest import auth_headers

pytestmark = pytest.mark.asyncio

PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk"
    "YAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)


async def make_post(db: AsyncSession, *, image_key: str | None = None) -> NewsPost:
    post = NewsPost(
        title="News image test",
        category=NewsCategory.general,
        summary="A sufficiently long test summary.",
        body="A sufficiently long news body for image testing.",
        image_key=image_key,
        image_alt="Students attending a seminar",
    )
    db.add(post)
    await db.flush()
    return post


async def test_admin_can_upload_news_image(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_token: str,
    monkeypatch: pytest.MonkeyPatch,
):
    post = await make_post(db_session)
    upload = AsyncMock(return_value="news/2026/07/cover.png")
    monkeypatch.setattr(news_routes.storage, "upload", upload)

    response = await client.post(
        f"/api/v1/news/{post.id}/image",
        headers=auth_headers(admin_token),
        files={"file": ("cover.png", PNG_1X1, "image/png")},
    )

    assert response.status_code == 200
    assert response.json()["image_url"].endswith("/news/2026/07/cover.png")
    assert response.json()["image_alt"] == "Students attending a seminar"
    upload.assert_awaited_once()


async def test_replacing_news_image_removes_old_object(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_token: str,
    monkeypatch: pytest.MonkeyPatch,
):
    post = await make_post(db_session, image_key="news/old.png")
    monkeypatch.setattr(
        news_routes.storage,
        "upload",
        AsyncMock(return_value="news/new.png"),
    )
    delete = AsyncMock()
    monkeypatch.setattr(news_routes.storage, "delete", delete)

    response = await client.post(
        f"/api/v1/news/{post.id}/image",
        headers=auth_headers(admin_token),
        files={"file": ("cover.png", PNG_1X1, "image/png")},
    )

    assert response.status_code == 200
    delete.assert_awaited_once_with("news/old.png")


async def test_news_image_rejects_non_image_content(
    client: AsyncClient,
    db_session: AsyncSession,
    admin_token: str,
):
    post = await make_post(db_session)
    response = await client.post(
        f"/api/v1/news/{post.id}/image",
        headers=auth_headers(admin_token),
        files={"file": ("fake.png", b"not an image", "image/png")},
    )

    assert response.status_code == 422
    assert "not allowed" in response.json()["detail"]


async def test_student_cannot_upload_news_image(
    client: AsyncClient,
    db_session: AsyncSession,
    student_token: str,
):
    post = await make_post(db_session)
    response = await client.post(
        f"/api/v1/news/{post.id}/image",
        headers=auth_headers(student_token),
        files={"file": ("cover.png", PNG_1X1, "image/png")},
    )
    assert response.status_code == 403
