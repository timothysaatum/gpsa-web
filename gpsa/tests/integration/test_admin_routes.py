from httpx import AsyncClient

from tests.conftest import auth_headers

BASE = "/api/v1/admin"


class TestAdminRoutes:
    async def test_dashboard_requires_auth(self, client: AsyncClient):
        response = await client.get(f"{BASE}/dashboard")
        assert response.status_code == 401

    async def test_dashboard_rejects_students(self, client: AsyncClient, student_token: str):
        response = await client.get(f"{BASE}/dashboard", headers=auth_headers(student_token))
        assert response.status_code == 403

    async def test_dashboard_allows_exec(self, client: AsyncClient, exec_token: str):
        response = await client.get(f"{BASE}/dashboard", headers=auth_headers(exec_token))
        assert response.status_code == 200
        body = response.json()
        assert "users" in body
        assert "recent_audit" in body
        assert body["recent_audit"] == []

    async def test_dashboard_allows_admin(self, client: AsyncClient, admin_token: str):
        response = await client.get(f"{BASE}/dashboard", headers=auth_headers(admin_token))
        assert response.status_code == 200

    async def test_audit_logs_admin_only(self, client: AsyncClient, exec_token: str, admin_token: str):
        exec_response = await client.get(f"{BASE}/audit-logs", headers=auth_headers(exec_token))
        assert exec_response.status_code == 403

        admin_response = await client.get(f"{BASE}/audit-logs", headers=auth_headers(admin_token))
        assert admin_response.status_code == 200
        body = admin_response.json()
        assert body["items"] == []
        assert body["total"] == 0

    async def test_audit_logs_enforce_bounded_pagination(
        self, client: AsyncClient, admin_token: str
    ):
        response = await client.get(
            f"{BASE}/audit-logs?limit=101", headers=auth_headers(admin_token)
        )
        assert response.status_code == 422

    async def test_audit_log_reads_are_audited(
        self, client: AsyncClient, admin_token: str
    ):
        first = await client.get(f"{BASE}/audit-logs", headers=auth_headers(admin_token))
        assert first.status_code == 200

        second = await client.get(
            f"{BASE}/audit-logs?action=VIEW&entity_type=audit_log",
            headers=auth_headers(admin_token),
        )
        assert second.status_code == 200
        assert second.json()["total"] == 1
        assert second.json()["items"][0]["action"] == "VIEW"
