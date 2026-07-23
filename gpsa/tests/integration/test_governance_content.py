from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.governance import DocumentCategory, FaqEntry, GovernanceDocument
from tests.conftest import auth_headers

API = "/api/v1"


async def test_public_page_excludes_drafts_and_restricted_documents(
    client: AsyncClient, db_session: AsyncSession
):
    category = DocumentCategory(name="Approved category", slug="approved", is_active=True)
    db_session.add(category)
    await db_session.flush()
    db_session.add_all([
        GovernanceDocument(
            category_id=category.id, title="Public", slug="public", document_type="policy",
            external_url="https://example.test/public.pdf", is_public=True,
            status="published", verification_status="verified",
        ),
        GovernanceDocument(
            category_id=category.id, title="Draft", slug="draft", document_type="policy",
            external_url="https://example.test/draft.pdf", is_public=True,
            status="draft", verification_status="verified",
        ),
        GovernanceDocument(
            category_id=category.id, title="Restricted", slug="restricted", document_type="policy",
            external_url="https://example.test/restricted.pdf", is_public=True,
            requires_authentication=True, status="published", verification_status="verified",
        ),
    ])
    db_session.add_all([
        FaqEntry(question="Published question?", slug="published-question", answer="Approved answer.", status="published"),
        FaqEntry(question="Draft question?", slug="draft-question", answer="Draft answer.", status="draft"),
    ])
    await db_session.commit()

    response = await client.get(f"{API}/about/governance")
    assert response.status_code == 200
    body = response.json()
    assert [item["title"] for item in body["documents"]] == ["Public"]
    assert [item["question"] for item in body["faqs"]] == ["Published question?"]
    assert "file_key" not in body["documents"][0]


async def test_admin_workflow_is_protected_and_exec_cannot_publish(
    client: AsyncClient, admin_token: str, exec_token: str
):
    path = f"{API}/about/governance/admin/categories"
    assert (await client.get(path)).status_code == 401
    category = await client.post(path, headers=auth_headers(admin_token), json={"data": {
        "name": "Policies", "slug": "policies", "display_order": 0, "is_active": True,
    }})
    assert category.status_code == 201
    faq = await client.post(f"{API}/about/governance/admin/faqs", headers=auth_headers(exec_token), json={"data": {
        "question": "Reviewed?", "slug": "reviewed", "answer": "Pending answer.", "status": "published",
    }})
    assert faq.status_code == 403
