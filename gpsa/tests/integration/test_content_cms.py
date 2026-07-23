from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.leadership import Leader, LeadershipTerm
from tests.conftest import auth_headers

API = "/api/v1"


async def test_public_leadership_excludes_contacts_and_inactive(
    client: AsyncClient, db_session: AsyncSession
):
    term = LeadershipTerm(title="Test Council", academic_year="2030/2031", is_current=True)
    db_session.add(term)
    await db_session.flush()
    db_session.add_all([
        Leader(
            term_id=term.id,
            full_name="Public Officer",
            office="President",
            email="private@example.com",
            phone="+233000000",
            is_active=True,
        ),
        Leader(
            term_id=term.id,
            full_name="Inactive Officer",
            office="Secretary",
            email="inactive@example.com",
            is_active=False,
        ),
    ])
    await db_session.commit()

    response = await client.get(f"{API}/leadership/current")
    assert response.status_code == 200
    body = response.json()
    assert [leader["full_name"] for leader in body["leaders"]] == ["Public Officer"]
    assert "email" not in body["leaders"][0]
    assert "phone" not in body["leaders"][0]


async def test_cms_page_requires_editor_and_published_history_is_public(
    client: AsyncClient, admin_token: str
):
    assert (await client.get(f"{API}/cms/pages/history")).status_code == 401
    payload = {
        "title": "History & Legacy",
        "is_published": True,
        "content": {
            "hero_eyebrow": "OUR ASSOCIATION",
            "hero_title": "A CMS History",
            "hero_intro_primary": "Primary introduction",
            "hero_intro_secondary": "Secondary introduction",
            "milestones": [],
            "achievements": [],
            "metrics": [],
            "traditions": [],
        },
    }
    saved = await client.put(
        f"{API}/cms/pages/history", json=payload, headers=auth_headers(admin_token)
    )
    assert saved.status_code == 200
    history = await client.get(f"{API}/about/history")
    assert history.status_code == 200
    assert history.json()["hero_title"] == "A CMS History"


async def test_cms_page_can_be_deleted_and_restored(
    client: AsyncClient, admin_token: str
):
    path = f"{API}/cms/pages/about-crud-test"
    payload = {
        "title": "CRUD Test",
        "is_published": True,
        "content": {"heading": "First version"},
    }
    created = await client.put(path, json=payload, headers=auth_headers(admin_token))
    assert created.status_code == 200
    assert (await client.get(f"{API}/cms/pages/public/about-crud-test")).status_code == 200

    deleted = await client.delete(path, headers=auth_headers(admin_token))
    assert deleted.status_code == 200
    assert (await client.get(f"{API}/cms/pages/public/about-crud-test")).status_code == 404

    payload["content"]["heading"] = "Restored version"
    restored = await client.put(path, json=payload, headers=auth_headers(admin_token))
    assert restored.status_code == 200
    assert restored.json()["content"]["heading"] == "Restored version"


async def test_legacy_content_crud_is_protected(client: AsyncClient, admin_token: str):
    path = f"{API}/about/legacy/admin/content/timeline"
    assert (await client.get(path)).status_code == 401
    created = await client.post(
        path,
        headers=auth_headers(admin_token),
        json={"data": {
            "year_label": "2030",
            "title": "Test milestone",
            "summary": "A test milestone created through the CMS.",
            "status": "draft",
            "display_order": 1,
        }},
    )
    assert created.status_code == 201
    item_id = created.json()["id"]
    updated = await client.patch(
        f"{path}/{item_id}",
        headers=auth_headers(admin_token),
        json={"data": {"status": "published"}},
    )
    assert updated.status_code == 200
    deleted = await client.delete(f"{path}/{item_id}", headers=auth_headers(admin_token))
    assert deleted.status_code == 200
