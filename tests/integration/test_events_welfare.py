"""Integration tests for /api/v1/events and /api/v1/welfare."""

from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

EVENTS_BASE = "/api/v1/events"
WELFARE_BASE = "/api/v1/welfare"


# ── Events ────────────────────────────────────────────────────────────────────

class TestEventsList:
    async def test_list_events_public(self, client: AsyncClient):
        resp = await client.get(f"{EVENTS_BASE}/")
        assert resp.status_code == 200
        body = resp.json()
        assert "items" in body
        assert "total" in body

    async def test_list_events_filter_by_status(self, client: AsyncClient):
        resp = await client.get(f"{EVENTS_BASE}/?event_status=upcoming")
        assert resp.status_code == 200

    async def test_featured_event_public(self, client: AsyncClient):
        resp = await client.get(f"{EVENTS_BASE}/featured")
        assert resp.status_code == 200  # null response is fine


class TestEventCreate:
    async def test_create_event_requires_auth(self, client: AsyncClient):
        resp = await client.post(f"{EVENTS_BASE}/", json={})
        assert resp.status_code == 401

    async def test_create_event_student_forbidden(
        self, client: AsyncClient, student_token: str
    ):
        payload = {
            "title": "Test Event",
            "description": "A test event description",
            "event_type": "academic",
            "start_datetime": (datetime.now(UTC) + timedelta(days=5)).isoformat(),
            "location": "Room 12",
        }
        resp = await client.post(
            f"{EVENTS_BASE}/",
            json=payload,
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert resp.status_code == 403

    async def test_create_event_admin_success(
        self, client: AsyncClient, admin_token: str
    ):
        payload = {
            "title": "Admin Test Event",
            "description": "A detailed description of the test event here",
            "event_type": "academic",
            "start_datetime": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
            "end_datetime": (datetime.now(UTC) + timedelta(days=7, hours=3)).isoformat(),
            "location": "UDS Auditorium",
        }
        resp = await client.post(
            f"{EVENTS_BASE}/",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["title"] == "Admin Test Event"
        assert body["status"] == "upcoming"

    async def test_create_event_end_before_start_rejected(
        self, client: AsyncClient, admin_token: str
    ):
        now = datetime.now(UTC)
        payload = {
            "title": "Bad Dates Event",
            "description": "This should fail validation",
            "event_type": "academic",
            "start_datetime": (now + timedelta(days=5)).isoformat(),
            "end_datetime": (now + timedelta(days=4)).isoformat(),
            "location": "Somewhere",
        }
        resp = await client.post(
            f"{EVENTS_BASE}/",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 422


class TestEventRegistration:
    async def _create_event(self, client, admin_token) -> str:
        payload = {
            "title": "Registration Test Event",
            "description": "For testing registration flow",
            "event_type": "social",
            "start_datetime": (datetime.now(UTC) + timedelta(days=3)).isoformat(),
            "location": "Main Hall",
        }
        resp = await client.post(
            f"{EVENTS_BASE}/",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        return resp.json()["id"]

    async def test_register_for_event_guest(
        self, client: AsyncClient, admin_token: str
    ):
        event_id = await self._create_event(client, admin_token)
        resp = await client.post(
            f"{EVENTS_BASE}/{event_id}/register",
            json={"full_name": "Guest User", "level": 300},
        )
        assert resp.status_code == 201
        assert resp.json()["full_name"] == "Guest User"

    async def test_duplicate_registration_rejected(
        self, client: AsyncClient, admin_token: str, student_token: str
    ):
        event_id = await self._create_event(client, admin_token)
        reg_payload = {"full_name": "Kwame", "level": 300}
        headers = {"Authorization": f"Bearer {student_token}"}

        await client.post(f"{EVENTS_BASE}/{event_id}/register", json=reg_payload, headers=headers)
        resp = await client.post(f"{EVENTS_BASE}/{event_id}/register", json=reg_payload, headers=headers)
        assert resp.status_code == 409

    async def test_list_registrations_requires_exec(
        self, client: AsyncClient, admin_token: str, student_token: str
    ):
        event_id = await self._create_event(client, admin_token)
        resp = await client.get(
            f"{EVENTS_BASE}/{event_id}/registrations",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert resp.status_code == 403

        resp = await client.get(
            f"{EVENTS_BASE}/{event_id}/registrations",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200


# ── Welfare ───────────────────────────────────────────────────────────────────

class TestWelfareReports:
    async def test_submit_issue_report(self, client: AsyncClient):
        resp = await client.post(
            f"{WELFARE_BASE}/reports",
            json={
                "report_type": "issue",
                "category": "academic",
                "description": "Lab chemicals not restocked for 3 weeks.",
                "is_anonymous": False,
                "name": "Kwame",
                "level": 300,
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["status"] == "pending"

    async def test_submit_confidential_strips_identity(self, client: AsyncClient):
        resp = await client.post(
            f"{WELFARE_BASE}/reports",
            json={
                "report_type": "confidential",
                "category": "welfare",
                "description": "I need support with personal issues.",
                "is_anonymous": True,
                "name": "Should be stripped",
                "level": 400,
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] is None
        assert body["level"] is None

    async def test_list_reports_requires_exec(self, client: AsyncClient, student_token: str):
        resp = await client.get(
            f"{WELFARE_BASE}/reports",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert resp.status_code == 403

    async def test_list_reports_admin_ok(self, client: AsyncClient, admin_token: str):
        resp = await client.get(
            f"{WELFARE_BASE}/reports",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200

    async def test_spotlight_public(self, client: AsyncClient):
        resp = await client.get(f"{WELFARE_BASE}/spotlight")
        assert resp.status_code == 200  # null is fine if none active

    async def test_create_spotlight_requires_exec(
        self, client: AsyncClient, student_token: str
    ):
        resp = await client.post(
            f"{WELFARE_BASE}/spotlight",
            json={"summary": "Test issue", "action_taken": "Being investigated"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert resp.status_code == 403

    async def test_create_spotlight_admin_ok(
        self, client: AsyncClient, admin_token: str
    ):
        resp = await client.post(
            f"{WELFARE_BASE}/spotlight",
            json={
                "summary": "Lab chemical shortage affecting Level 300",
                "action_taken": "Raised with Faculty Dean — response expected by Friday",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 201
        assert resp.json()["is_active"] is True
