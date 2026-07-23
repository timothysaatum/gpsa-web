import uuid
from contextlib import suppress
from typing import Annotated
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, File, Request, UploadFile
from pydantic import Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.routes.cms import get_published_page
from app.api.v1.routes.stats import get_stats
from app.core.dependencies import CurrentUser, require_roles
from app.db.session import get_db
from app.models.enums import EventStatus, UserRole
from app.models.gallery import GalleryImage
from app.models.partner import Partner
from app.repositories.base import BaseRepository
from app.repositories.event import EventRepository
from app.schemas.common import AppModel, MessageResponse
from app.services.audit import AuditService
from app.services.news import NewsService
from app.services.opportunity import OpportunityService
from app.services.storage import storage
from app.services.welfare import WelfareService
from app.utils.file_validation import validate_image_file


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
    id: uuid.UUID
    name: str
    logo_url: str | None = None
    website_url: str | None = None
    sort_order: int = 0
    is_published: bool = True


class PartnerCreate(AppModel):
    name: str = Field(min_length=2, max_length=200)
    website_url: str | None = Field(default=None, max_length=1000)
    sort_order: int = Field(default=0, ge=0, le=10_000)
    is_published: bool = True

    @field_validator("website_url")
    @classmethod
    def validate_website_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Website URL must be a complete HTTP or HTTPS URL.")
        return value


class PartnerUpdate(AppModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    website_url: str | None = Field(default=None, max_length=1000)
    sort_order: int | None = Field(default=None, ge=0, le=10_000)
    is_published: bool | None = None

    @field_validator("website_url")
    @classmethod
    def validate_website_url(cls, value: str | None) -> str | None:
        return PartnerCreate.validate_website_url(value)


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
    partner_result = await db.execute(
        select(Partner)
        .where(Partner.deleted_at.is_(None), Partner.is_published.is_(True))
        .order_by(Partner.sort_order.asc(), Partner.created_at.asc())
    )
    partners = list(partner_result.scalars().all())

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
        partners=[PartnerSchema.model_validate(partner) for partner in partners],
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


@router.get(
    "/partners/admin",
    response_model=list[PartnerSchema],
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def list_partners_admin(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[PartnerSchema]:
    result = await db.execute(
        select(Partner)
        .where(Partner.deleted_at.is_(None))
        .order_by(Partner.sort_order.asc(), Partner.created_at.asc())
        .limit(200)
    )
    partners = list(result.scalars().all())
    return [PartnerSchema.model_validate(partner) for partner in partners]


@router.post(
    "/partners",
    response_model=PartnerSchema,
    status_code=201,
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def create_partner(
    payload: PartnerCreate,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerSchema:
    partner = await BaseRepository(Partner, db).create(payload.model_dump())
    await AuditService(db).log(
        action="CREATE",
        entity_type="partner",
        entity_id=partner.id,
        new_values=payload.model_dump(),
        request=request,
    )
    await db.commit()
    return PartnerSchema.model_validate(partner)


@router.patch(
    "/partners/{partner_id}",
    response_model=PartnerSchema,
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def update_partner(
    partner_id: uuid.UUID,
    payload: PartnerUpdate,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PartnerSchema:
    repo = BaseRepository(Partner, db)
    partner = await repo.get_by_id_or_404(partner_id)
    updates = payload.model_dump(exclude_unset=True)
    partner = await repo.update(partner, updates)
    await AuditService(db).log(
        action="UPDATE",
        entity_type="partner",
        entity_id=partner.id,
        new_values=updates,
        request=request,
    )
    await db.commit()
    return PartnerSchema.model_validate(partner)


@router.post(
    "/partners/{partner_id}/logo",
    response_model=PartnerSchema,
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def upload_partner_logo(
    partner_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(..., description="Partner logo (JPEG, PNG, WebP or GIF; max 10 MB)"),
) -> PartnerSchema:
    repo = BaseRepository(Partner, db)
    partner = await repo.get_by_id_or_404(partner_id)
    validated = validate_image_file(await file.read(), file.filename or "partner-logo.png")
    new_key = await storage.upload(
        content=validated.content,
        folder="partners",
        filename=file.filename or "partner-logo.png",
        mime_type=validated.mime_type,
        public=True,
    )
    old_key = partner.logo_key
    try:
        partner = await repo.update(
            partner,
            {"logo_key": new_key, "logo_url": storage.cdn_url(new_key)},
        )
        await AuditService(db).log(
            action="UPLOAD_LOGO",
            entity_type="partner",
            entity_id=partner.id,
            new_values={"logo_key": new_key},
            request=request,
        )
        await db.commit()
    except Exception:
        await db.rollback()
        with suppress(Exception):
            await storage.delete(new_key)
        raise
    if old_key:
        with suppress(Exception):
            await storage.delete(old_key)
    return PartnerSchema.model_validate(partner)


@router.delete(
    "/partners/{partner_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles(UserRole.exec, UserRole.admin))],
)
async def delete_partner(
    partner_id: uuid.UUID,
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    repo = BaseRepository(Partner, db)
    partner = await repo.get_by_id_or_404(partner_id)
    await repo.soft_delete(partner)
    await AuditService(db).log(
        action="DELETE",
        entity_type="partner",
        entity_id=partner.id,
        request=request,
    )
    await db.commit()
    if partner.logo_key:
        with suppress(Exception):
            await storage.delete(partner.logo_key)
    return MessageResponse(message="Partner deleted.")


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

    default_content = HistoryPageResponse(
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
    cms_page = await get_published_page(db, "history")
    if cms_page is None:
        return default_content
    content = {**default_content.model_dump(), **cms_page.content}
    # Gallery is a managed collection and never trusted from arbitrary page JSON.
    content["gallery_preview"] = default_content.gallery_preview
    return HistoryPageResponse.model_validate(content)
