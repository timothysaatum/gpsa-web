"""Regression tests for public API contracts used by the frontend UI."""

from datetime import UTC, date, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.academic_resource import AcademicResource
from app.models.course import Course
from app.models.enums import (
    ContentType,
    EventStatus,
    EventType,
    FileType,
    NewsCategory,
    OpportunityType,
    ReportStatus,
    ReportType,
    Trimester,
    WelfareCategory,
)
from app.models.event import Event
from app.models.news import NewsPost
from app.models.opportunity import Opportunity
from app.models.welfare import WelfareReport

pytestmark = pytest.mark.asyncio


class TestPublicListTotals:
    async def test_events_total_matches_filters(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        now = datetime.now(UTC)
        db_session.add_all(
            [
                Event(
                    title="Upcoming academic",
                    description="A public event",
                    event_type=EventType.academic,
                    status=EventStatus.upcoming,
                    start_datetime=now + timedelta(days=3),
                    location="Auditorium",
                ),
                Event(
                    title="Past social",
                    description="A public event",
                    event_type=EventType.social,
                    status=EventStatus.past,
                    start_datetime=now - timedelta(days=3),
                    location="Auditorium",
                ),
            ]
        )
        await db_session.flush()

        resp = await client.get("/api/v1/events/?event_status=upcoming")

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert [item["title"] for item in body["items"]] == ["Upcoming academic"]

    async def test_news_total_excludes_drafts_and_respects_category(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        db_session.add_all(
            [
                NewsPost(
                    title="Published announcement",
                    category=NewsCategory.announcement,
                    summary="Published summary",
                    body="Published body with enough detail.",
                    published_at=datetime.now(UTC),
                ),
                NewsPost(
                    title="Draft announcement",
                    category=NewsCategory.announcement,
                    summary="Draft summary",
                    body="Draft body with enough detail.",
                ),
                NewsPost(
                    title="Published welfare",
                    category=NewsCategory.welfare_update,
                    summary="Published summary",
                    body="Published body with enough detail.",
                    published_at=datetime.now(UTC),
                ),
            ]
        )
        await db_session.flush()

        resp = await client.get("/api/v1/news/?category=announcement")

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert [item["title"] for item in body["items"]] == ["Published announcement"]

    async def test_welfare_total_matches_admin_filters(
        self, client: AsyncClient, db_session: AsyncSession, admin_token: str
    ):
        db_session.add_all(
            [
                WelfareReport(
                    report_type=ReportType.issue,
                    category=WelfareCategory.academic,
                    description="Pending issue report",
                    is_anonymous=False,
                    status=ReportStatus.pending,
                    submitted_at=datetime.now(UTC),
                ),
                WelfareReport(
                    report_type=ReportType.support,
                    category=WelfareCategory.health,
                    description="Resolved support report",
                    is_anonymous=True,
                    status=ReportStatus.resolved,
                    submitted_at=datetime.now(UTC),
                ),
            ]
        )
        await db_session.flush()

        resp = await client.get(
            "/api/v1/welfare/reports?report_status=resolved",
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert body["items"][0]["status"] == "resolved"


class TestPublicVisibility:
    async def test_unpublished_academic_resource_is_not_public(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        course = Course(name="Clinical Pharmacy", code="CPH501", level=500)
        db_session.add(course)
        await db_session.flush()
        resource = AcademicResource(
            title="Pending slides",
            content_type=ContentType.lecture_slides,
            course_id=course.id,
            level=500,
            trimester=Trimester.first,
            file_key="academic/pending.pdf",
            file_type=FileType.pdf,
            mime_type="application/pdf",
            file_size_bytes=1024,
            is_published=False,
        )
        db_session.add(resource)
        await db_session.flush()

        resp = await client.get(f"/api/v1/academic-resources/{resource.id}")

        assert resp.status_code == 404

    async def test_academic_total_matches_filters(
        self, client: AsyncClient, db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
    ):
        from app.api.v1.routes import academic_resources

        async def fake_presign(key: str, expires_in: int = 3600) -> str:
            return f"https://files.test/{key}"

        monkeypatch.setattr(academic_resources.storage, "presign", fake_presign)

        course = Course(name="Pharmacology", code="PHR301", level=300)
        db_session.add(course)
        await db_session.flush()
        db_session.add_all(
            [
                AcademicResource(
                    title="Published slides",
                    content_type=ContentType.lecture_slides,
                    course_id=course.id,
                    level=300,
                    trimester=Trimester.first,
                    file_key="academic/slides.pdf",
                    file_type=FileType.pdf,
                    mime_type="application/pdf",
                    file_size_bytes=2048,
                    is_published=True,
                ),
                AcademicResource(
                    title="Pending slides",
                    content_type=ContentType.lecture_slides,
                    course_id=course.id,
                    level=300,
                    trimester=Trimester.first,
                    file_key="academic/pending.pdf",
                    file_type=FileType.pdf,
                    mime_type="application/pdf",
                    file_size_bytes=1024,
                    is_published=False,
                ),
            ]
        )
        await db_session.flush()

        resp = await client.get("/api/v1/academic-resources/?level=300")

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert [item["title"] for item in body["items"]] == ["Published slides"]

    async def test_unpublished_opportunity_is_not_public(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        opp = Opportunity(
            title="Pending scholarship",
            organization="GPSA",
            opp_type=OpportunityType.scholarship,
            description="Scholarship details for students.",
            deadline=date.today() + timedelta(days=10),
            external_link="https://example.com/apply",
            is_active=True,
            is_published=False,
        )
        db_session.add(opp)
        await db_session.flush()

        resp = await client.get(f"/api/v1/opportunities/{opp.id}")

        assert resp.status_code == 404

    async def test_opportunities_total_matches_filters(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        db_session.add_all(
            [
                Opportunity(
                    title="Published internship",
                    organization="Hospital",
                    opp_type=OpportunityType.internship,
                    description="Internship details for students.",
                    deadline=date.today() + timedelta(days=10),
                    external_link="https://example.com/internship",
                    is_active=True,
                    is_published=True,
                ),
                Opportunity(
                    title="Published scholarship",
                    organization="Foundation",
                    opp_type=OpportunityType.scholarship,
                    description="Scholarship details for students.",
                    deadline=date.today() + timedelta(days=10),
                    external_link="https://example.com/scholarship",
                    is_active=True,
                    is_published=True,
                ),
            ]
        )
        await db_session.flush()

        resp = await client.get("/api/v1/opportunities/?opp_type=internship")

        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 1
        assert [item["title"] for item in body["items"]] == ["Published internship"]
