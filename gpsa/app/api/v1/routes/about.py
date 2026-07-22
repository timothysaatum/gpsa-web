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


class PresidentWelcomeSchema(AppModel):
    name: str = "Jacob N. Adjei"
    title: str = "President, GPSA-UDS"
    admin_year: str = "2025/2026 Administration"
    photo_url: str | None = None
    message: str = (
        "Welcome to GPSA-UDS. Together, we are building a community where every pharmacy student "
        "is supported, every voice is heard and every dream is possible.\n\n"
        "As your President, I encourage you to get involved, take advantage of the opportunities "
        "we create and help us shape a stronger, more impactful association."
    )


class CoreValueSchema(AppModel):
    name: str
    description: str


class WhatWeDoSchema(AppModel):
    title: str
    description: str
    items: list[str]
    href: str | None = None


class GovernanceBodySchema(AppModel):
    title: str
    description: str


class StrategicPrioritySchema(AppModel):
    title: str
    description: str


class ImpactMetricsSchema(AppModel):
    reporting_period: str = "2025/2026 Impact"
    students_represented: str = "1,250+"
    programmes_organised: str = "28"
    welfare_interventions: str = "320+"
    outreach_beneficiaries: str = "5,600+"
    opportunities_shared: str = "150+"
    active_partnerships: str = "25+"


class PartnerSchema(AppModel):
    name: str
    logo_key: str


class AboutContentResponse(AppModel):
    name: str
    short_name: str
    tagline: str
    overview: str
    mission: str
    vision: str
    values: list[str]
    core_values_detailed: list[CoreValueSchema]
    pillars: list[dict]
    what_we_do: list[WhatWeDoSchema]
    timeline: list[dict]
    stats: dict
    impact_metrics: ImpactMetricsSchema
    president_welcome: PresidentWelcomeSchema
    governance: list[GovernanceBodySchema]
    strategic_priorities: list[StrategicPrioritySchema]
    partners: list[PartnerSchema]
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
        .limit(5)
    )
    gallery = list(gallery_result.scalars().all())

    return AboutContentResponse(
        name="Ghana Pharmaceutical Students' Association, UDS",
        short_name="GPSA-UDS",
        tagline="Students first. Pharmacy forward.",
        overview=(
            "The Ghana Pharmaceutical Students' Association at the University for "
            "Development Studies is the official representative body for pharmacy students.\n\n"
            "We promote academic excellence, protect student welfare, provide professional-development "
            "opportunities and represent the collective interests of our members within the university "
            "and the wider pharmacy profession."
        ),
        mission=(
            "To promote academic excellence, advocate for students, support welfare, "
            "provide professional-development opportunities and represent the collective "
            "interests of pharmacy students at UDS."
        ),
        vision=(
            "To be a leading student association that empowers pharmacy students to become "
            "innovative, ethical and impactful professionals who transform healthcare "
            "and communities."
        ),
        values=[
            "Professionalism",
            "Leadership",
            "Excellence",
            "Integrity",
            "Service",
            "Unity",
            "Innovation",
        ],
        core_values_detailed=[
            {"name": "Professionalism", "description": "Upholding ethical pharmaceutical standards and conduct."},
            {"name": "Leadership", "description": "Inspiring responsibility, initiative and vision."},
            {"name": "Excellence", "description": "Striving for distinction in academics and service."},
            {"name": "Integrity", "description": "Fostering honesty, transparency and trust."},
            {"name": "Service", "description": "Dedicated to student welfare and public health outreach."},
            {"name": "Unity", "description": "Fostering solidarity across all year groups and cohorts."},
            {"name": "Innovation", "description": "Embracing modern approaches to learning and governance."},
        ],
        pillars=[
            {
                "title": "Academic Development",
                "body": "Tutorials, seminars, study resources, and academic advocacy.",
            },
            {
                "title": "Student Welfare",
                "body": "Welfare support, confidential assistance, and advocacy.",
            },
            {
                "title": "Professional Development",
                "body": "Conferences, workshops, career programs, and industry exposure.",
            },
            {
                "title": "Community Engagement",
                "body": "Health screenings, public health campaigns, and community outreach.",
            },
            {
                "title": "Social & Student Life",
                "body": "Orientation, sports, dinners, entertainment, and networking.",
            },
        ],
        what_we_do=[
            {
                "title": "Academic Development",
                "description": "Strengthening academic performance and learning resources.",
                "items": ["Tutorials", "Academic seminars", "Study resources", "Academic advocacy"],
                "href": "/academics",
            },
            {
                "title": "Student Welfare",
                "description": "Providing responsive care and emergency assistance.",
                "items": ["Welfare support", "Confidential assistance", "Advocacy", "Representation"],
                "href": "/welfare",
            },
            {
                "title": "Professional Development",
                "description": "Preparing students for impactful pharmacy careers.",
                "items": ["Conferences", "Workshops", "Career programmes", "Industry exposure"],
                "href": "/opportunities",
            },
            {
                "title": "Community Engagement",
                "description": "Extending healthcare impact to local communities.",
                "items": ["Health screenings", "Public health campaigns", "Community outreach", "Health education"],
                "href": "/events",
            },
            {
                "title": "Social & Student Life",
                "description": "Fostering camaraderie, balance and vibrant campus life.",
                "items": ["Orientation", "Games & sports", "Dinners", "Entertainment"],
                "href": "/events",
            },
        ],
        governance=[
            {
                "title": "General Assembly",
                "description": "The highest deliberative body where members discuss and decide on major policies and reports.",
            },
            {
                "title": "Executive Board",
                "description": "Leads the association and is responsible for day-to-day administration and implementation of programmes.",
            },
            {
                "title": "Standing Committees",
                "description": "Support specialised areas including academics, welfare, events, communications and professional development.",
            },
            {
                "title": "Judicial Board",
                "description": "Interprets governing rules and handles constitutional and disciplinary matters within its mandate.",
            },
            {
                "title": "Electoral Commission",
                "description": "Independently manages elections and ensures a fair and transparent electoral process.",
            },
        ],
        strategic_priorities=[
            {
                "title": "Academic Excellence",
                "description": "Strengthen academic support systems and promote a culture of excellence.",
            },
            {
                "title": "Responsive Welfare",
                "description": "Create a safe, supportive and caring environment for all students.",
            },
            {
                "title": "Professional Exposure",
                "description": "Increase student access to industry and professional opportunities.",
            },
            {
                "title": "Transparent Leadership",
                "description": "Uphold accountability, openness and effective communication.",
            },
            {
                "title": "Community Impact",
                "description": "Expand outreach and improve health outcomes in our communities.",
            },
            {
                "title": "Digital Transformation",
                "description": "Leverage technology to improve communication and services.",
            },
        ],
        impact_metrics=ImpactMetricsSchema(
            reporting_period="2025/2026 Impact",
            students_represented="1,250+",
            programmes_organised="28",
            welfare_interventions="320+",
            outreach_beneficiaries="5,600+",
            opportunities_shared="150+",
            active_partnerships="25+",
        ),
        president_welcome=PresidentWelcomeSchema(),
        timeline=[
            {"year": "2015", "title": "Formation of GPSA-UDS", "body": "GPSA-UDS began formal student representation and advocacy."},
            {"year": "2018", "title": "Growth of welfare & academic support", "body": "A clearer welfare channel was established for student wellbeing."},
            {"year": "2021", "title": "Expansion of professional programmes", "body": "Academic support expanded through shared learning material."},
            {"year": "2024", "title": "Launch of digital student platform", "body": "Events, resources, welfare, news, gallery, and opportunities moved into one public platform."},
        ],
        partners=[
            {"name": "University for Development Studies", "logo_key": "uds"},
            {"name": "School of Pharmacy", "logo_key": "sop"},
            {"name": "National GPSA", "logo_key": "ngpsa"},
            {"name": "Pharmaceutical Society of Ghana", "logo_key": "psgh"},
            {"name": "Pharmacy Council", "logo_key": "pc"},
            {"name": "Korle Bu Teaching Hospital", "logo_key": "kbth"},
            {"name": "Tobinco Pharmaceuticals", "logo_key": "tobinco"},
            {"name": "Ernest Chemists Foundation", "logo_key": "ernest"},
            {"name": "GSK Ghana", "logo_key": "gsk"},
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


class HistoryMilestoneSchema(AppModel):
    year_label: str
    title: str
    summary: str
    icon_name: str | None = None
    image_url: str | None = None


class HistoryAchievementSchema(AppModel):
    category: str
    title: str
    summary: str
    icon_name: str | None = None


class HistoryMetricSchema(AppModel):
    value: str
    label: str
    icon_name: str | None = None
    reporting_period: str | None = None


class HistoryTraditionSchema(AppModel):
    title: str
    description: str
    icon_name: str | None = None


class HistoryPageResponse(AppModel):
    hero_eyebrow: str = "ABOUT GPSA-UDS"
    hero_title: str = "Our History & Legacy"
    hero_intro_primary: str = (
        "From humble beginnings to a vibrant community of leaders, GPSA-UDS has grown through the passion, commitment, and unity of pharmacy students across generations."
    )
    hero_intro_secondary: str = (
        "Our story is one of service, growth, resilience and the enduring Pharmily spirit that continues to shape our future."
    )
    milestones: list[HistoryMilestoneSchema]
    achievements: list[HistoryAchievementSchema]
    metrics: list[HistoryMetricSchema]
    traditions: list[HistoryTraditionSchema]
    gallery_preview: list[dict]


@router.get("/history", response_model=HistoryPageResponse, summary="Get public History & Legacy page content")
async def get_history_content(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HistoryPageResponse:
    gallery_result = await db.execute(
        select(GalleryImage)
        .where(GalleryImage.deleted_at.is_(None))
        .order_by(GalleryImage.sort_order.asc(), GalleryImage.created_at.desc())
        .limit(6)
    )
    gallery = list(gallery_result.scalars().all())

    milestones = [
        HistoryMilestoneSchema(
            year_label="2015",
            title="The Beginning",
            summary="A small group of passionate pharmacy students laid the foundation for student unity and representation at UDS.",
            icon_name="Users",
        ),
        HistoryMilestoneSchema(
            year_label="2018",
            title="Official Recognition",
            summary="GPSA-UDS was officially recognised by the School of Pharmacy and the University for Development Studies.",
            icon_name="Sprout",
        ),
        HistoryMilestoneSchema(
            year_label="2021",
            title="Growth & Expansion",
            summary="Introduction of new welfare initiatives, academic support programmes and professional development activities.",
            icon_name="TrendingUp",
        ),
        HistoryMilestoneSchema(
            year_label="2023",
            title="Stronger Partnerships",
            summary="Built meaningful partnerships with industry, health institutions and professional bodies to expand opportunities.",
            icon_name="Handshake",
        ),
        HistoryMilestoneSchema(
            year_label="2025",
            title="Digital Transformation",
            summary="Launched digital platforms, modernised our systems and deepened our impact across campus and communities.",
            icon_name="Star",
        ),
    ]

    achievements = [
        HistoryAchievementSchema(
            category="Academic Excellence",
            title="Academic Excellence",
            summary="Organised countless tutorials, seminars and academic programmes that continue to uplift student performance.",
            icon_name="BookOpen",
        ),
        HistoryAchievementSchema(
            category="Welfare First",
            title="Welfare First",
            summary="Provided welfare support, advocacy and representation that protect and empower students.",
            icon_name="Heart",
        ),
        HistoryAchievementSchema(
            category="Professional Growth",
            title="Professional Growth",
            summary="Created platforms for exposure, internships, workshops and conferences that shape future pharmacists.",
            icon_name="Briefcase",
        ),
        HistoryAchievementSchema(
            category="Community Impact",
            title="Community Impact",
            summary="Led health screenings, outreach programmes and public health campaigns across communities.",
            icon_name="Users",
        ),
        HistoryAchievementSchema(
            category="National & Global Reach",
            title="National & Global Reach",
            summary="Strengthened our presence with National GPSA and expanded our networks beyond borders.",
            icon_name="Globe",
        ),
        HistoryAchievementSchema(
            category="Leadership Development",
            title="Leadership Development",
            summary="Nurtured student leaders who go on to excel in pharmacy and other professional fields.",
            icon_name="Award",
        ),
    ]

    metrics = [
        HistoryMetricSchema(value="1,250+", label="Students represented since inception", icon_name="Users"),
        HistoryMetricSchema(value="80+", label="Academic programmes organised", icon_name="GraduationCap"),
        HistoryMetricSchema(value="320+", label="Welfare interventions provided", icon_name="Heart"),
        HistoryMetricSchema(value="5,600+", label="Community members impacted", icon_name="Users"),
        HistoryMetricSchema(value="25+", label="Active partnerships and collaborations", icon_name="Handshake"),
        HistoryMetricSchema(value="100+", label="Student leaders developed", icon_name="Award"),
    ]

    traditions = [
        HistoryTraditionSchema(
            title="Pharmily Unity",
            description="Fostering lifelong solidarity and community spirit among all cohorts.",
            icon_name="Users",
        ),
        HistoryTraditionSchema(
            title="Excellence in All We Do",
            description="Setting highest standards in academic, clinical and professional endeavors.",
            icon_name="Trophy",
        ),
        HistoryTraditionSchema(
            title="Service to Humanity",
            description="Dedication to public health screenings and community health education.",
            icon_name="Heart",
        ),
        HistoryTraditionSchema(
            title="Leading with Integrity",
            description="Upholding ethical practice, transparency and accountability in governance.",
            icon_name="Star",
        ),
        HistoryTraditionSchema(
            title="Leaving a Lasting Legacy",
            description="Empowering every generation of students to build for the next.",
            icon_name="Users",
        ),
    ]

    return HistoryPageResponse(
        milestones=milestones,
        achievements=achievements,
        metrics=metrics,
        traditions=traditions,
        gallery_preview=[
            {
                "id": str(img.id),
                "title": img.title,
                "image_url": img.image_url,
                "thumbnail_url": img.thumbnail_url,
                "category": img.category,
            }
            for img in gallery
        ],
    )

