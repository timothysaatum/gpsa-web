from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routes.stats import get_stats
from app.db.session import get_db
from app.models.enums import EventStatus
from app.models.gallery import GalleryImage
from app.schemas.common import AppModel
from app.services.news import NewsService
from app.services.opportunity import OpportunityService
from app.repositories.event import EventRepository
from app.services.welfare import WelfareService


class AboutContentResponse(AppModel):
    name: str
    short_name: str
    tagline: str
    overview: str
    mission: str
    vision: str
    values: list[str]
    pillars: list[dict]
    timeline: list[dict]
    stats: dict
    featured_news: dict | None
    upcoming_events: list[dict]
    open_opportunities: list[dict]
    gallery_highlights: list[dict]
    welfare: dict


router = APIRouter(tags=["About"])


@router.get("/", response_model=AboutContentResponse, summary="Get public About page content")
async def get_about_content(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AboutContentResponse:
    stats = await get_stats(db)
    news = await NewsService(db).get_featured()
    events = await EventRepository(db).list_filtered(status=EventStatus.upcoming, offset=0, limit=3)
    opportunities, _ = await OpportunityService(db).list_filtered(
        sort_by="deadline",
        sort_order="asc",
        offset=0,
        limit=3,
    )
    welfare = await WelfareService(db).get_config()

    gallery_result = await db.execute(
        select(GalleryImage)
        .where(GalleryImage.deleted_at.is_(None))
        .order_by(GalleryImage.sort_order.asc(), GalleryImage.created_at.desc())
        .limit(4)
    )
    gallery = list(gallery_result.scalars().all())

    return AboutContentResponse(
        name="Ghana Pharmaceutical Students' Association, UDS",
        short_name="GPSA-UDS",
        tagline="Representing pharmacy students with clarity, care, and professional purpose.",
        overview=(
            "GPSA-UDS is the representative body for pharmacy students at the "
            "University for Development Studies. The association advances student "
            "welfare, academic excellence, leadership, professional development, "
            "and community service."
        ),
        mission="To empower pharmacy students to thrive academically, socially, and professionally.",
        vision=(
            "To be a credible, student-centred association recognised for excellence, "
            "service, advocacy, and ethical pharmaceutical leadership."
        ),
        values=[
            "Integrity",
            "Service",
            "Accountability",
            "Academic excellence",
            "Student welfare",
            "Professional growth",
        ],
        pillars=[
            {
                "title": "Academic Support",
                "body": "Resources, learning support, and academic advocacy for every level.",
            },
            {
                "title": "Welfare and Care",
                "body": "Confidential support channels and practical response to student concerns.",
            },
            {
                "title": "Professional Growth",
                "body": "Events, opportunities, and exposure for future pharmacy practice.",
            },
            {
                "title": "Community Service",
                "body": "Outreach and health-focused service shaped by public need.",
            },
        ],
        timeline=[
            {"year": "2015", "title": "Association foundation", "body": "GPSA-UDS began formal student representation and advocacy."},
            {"year": "2018", "title": "Welfare strengthened", "body": "A clearer welfare channel was established for student wellbeing."},
            {"year": "2021", "title": "Academic resource focus", "body": "Academic support expanded through shared learning material."},
            {"year": "2025", "title": "Digital student portal", "body": "Events, resources, welfare, news, gallery, and opportunities moved into one public platform."},
        ],
        stats=stats,
        featured_news={
            "id": str(news.id),
            "title": news.title,
            "summary": news.summary,
            "category": news.category.value,
            "published_at": news.published_at,
        } if news else None,
        upcoming_events=[
            {
                "id": str(event.id),
                "title": event.title,
                "location": event.location,
                "start_datetime": event.start_datetime,
                "event_type": event.event_type.value,
            }
            for event in events
        ],
        open_opportunities=[
            {
                "id": str(opp.id),
                "title": opp.title,
                "organization": opp.organization,
                "deadline": opp.deadline,
                "opp_type": opp.opp_type.value,
            }
            for opp in opportunities
        ],
        gallery_highlights=[
            {
                "id": str(image.id),
                "title": image.title,
                "image_url": image.image_url,
                "thumbnail_url": image.thumbnail_url,
                "category": image.category,
            }
            for image in gallery
        ],
        welfare=welfare,
    )
