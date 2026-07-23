import asyncio
from datetime import UTC, date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.leadership import Leader, LeadershipTerm
from app.models.legacy import (
    LeadershipAdministration,
    LeadershipTimelineEvent,
    LegacyAward,
    RecognitionCategory,
)


async def seed_legacy_data(db: AsyncSession):
    print("Seeding Past Leadership & Recognition data...")

    # 1. Administrations
    administrations_data = [
        {
            "academic_year": "2024/2025",
            "slug": "2024-2025",
            "title": "2024/2025 Administration",
            "theme": "Pharmacy United, Impact Amplified.",
            "slogan": "Pharmacy United, Impact Amplified.",
            "starts_at": date(2024, 6, 1),
            "ends_at": date(2025, 5, 31),
            "group_photo_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
            "group_photo_alt": "2024/2025 GPSA-UDS Executive Board Photo",
            "is_current": True,
            "status": "published",
            "summary": "Focused on digital transformation, academic excellence, member welfare expansion, and national positioning of GPSA-UDS.",
            "executive_count": 12,
            "committee_count": 6,
            "initiatives_count": 28,
            "lives_impacted": "5,600+",
            "display_order": 1,
            "published_at": datetime.now(UTC),
        },
        {
            "academic_year": "2023/2024",
            "slug": "2023-2024",
            "title": "2023/2024 Administration",
            "theme": "Excellence in Action, Service with Purpose.",
            "slogan": "Excellence in Action",
            "starts_at": date(2023, 6, 1),
            "ends_at": date(2024, 5, 31),
            "group_photo_url": "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
            "group_photo_alt": "2023/2024 GPSA-UDS Executive Board Photo",
            "is_current": False,
            "status": "published",
            "summary": "Pioneered expanded clinical outreach, welfare relief funds, and enhanced student-faculty dialogue.",
            "executive_count": 11,
            "committee_count": 5,
            "initiatives_count": 24,
            "lives_impacted": "4,800+",
            "display_order": 2,
            "published_at": datetime.now(UTC),
        },
        {
            "academic_year": "2022/2023",
            "slug": "2022-2023",
            "title": "2022/2023 Administration",
            "theme": "Building Bridges, Empowering Pharmacists.",
            "slogan": "Empowering Tomorrow's Pharmacists",
            "starts_at": date(2022, 6, 1),
            "ends_at": date(2023, 5, 31),
            "group_photo_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
            "group_photo_alt": "2022/2023 GPSA-UDS Executive Board Photo",
            "is_current": False,
            "status": "published",
            "summary": "Established formal academic tutorial repositories and expanded professional development symposiums.",
            "executive_count": 10,
            "committee_count": 5,
            "initiatives_count": 20,
            "lives_impacted": "4,000+",
            "display_order": 3,
            "published_at": datetime.now(UTC),
        },
        {
            "academic_year": "2021/2022",
            "slug": "2021-2022",
            "title": "2021/2022 Administration",
            "theme": "Resilience, Innovation and Growth.",
            "slogan": "Resilience & Growth",
            "starts_at": date(2021, 6, 1),
            "ends_at": date(2022, 5, 31),
            "group_photo_url": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
            "group_photo_alt": "2021/2022 GPSA-UDS Executive Board Photo",
            "is_current": False,
            "status": "published",
            "summary": "Navigated post-pandemic academic integration and launched annual health screening tours across the Northern region.",
            "executive_count": 10,
            "committee_count": 4,
            "initiatives_count": 18,
            "lives_impacted": "3,500+",
            "display_order": 4,
            "published_at": datetime.now(UTC),
        },
        {
            "academic_year": "2020/2021",
            "slug": "2020-2021",
            "title": "2020/2021 Administration",
            "theme": "Unity in Diversity, Excellence in Service.",
            "slogan": "Unity & Service",
            "starts_at": date(2020, 6, 1),
            "ends_at": date(2021, 5, 31),
            "group_photo_url": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
            "group_photo_alt": "2020/2021 GPSA-UDS Executive Board Photo",
            "is_current": False,
            "status": "published",
            "summary": "Strengthened association constitution and expanded National GPSA representation.",
            "executive_count": 9,
            "committee_count": 4,
            "initiatives_count": 15,
            "lives_impacted": "3,000+",
            "display_order": 5,
            "published_at": datetime.now(UTC),
        },
    ]

    admin_map = {}
    for item in administrations_data:
        term_result = await db.execute(
            select(LeadershipTerm).where(LeadershipTerm.academic_year == item["academic_year"])
        )
        term = term_result.scalar_one_or_none()
        if term is None:
            term = LeadershipTerm(
                title=item["title"],
                academic_year=item["academic_year"],
                start_date=item["starts_at"],
                end_date=item["ends_at"],
                theme=item["theme"],
                summary=item["summary"],
                is_current=item["is_current"],
                sort_order=item["display_order"],
            )
            db.add(term)
            await db.flush()
        res = await db.execute(
            select(LeadershipAdministration).where(LeadershipAdministration.academic_year == item["academic_year"])
        )
        existing = res.scalar_one_or_none()
        if not existing:
            obj = LeadershipAdministration(term_id=term.id, **item)
            db.add(obj)
            await db.flush()
            admin_map[item["academic_year"]] = obj
        else:
            existing.term_id = term.id
            admin_map[item["academic_year"]] = existing

    # Also check / seed corresponding LeadershipTerm and Leaders for 2024/2025
    term_res = await db.execute(select(LeadershipTerm).where(LeadershipTerm.academic_year == "2024/2025"))
    term_2024 = term_res.scalar_one_or_none()
    if not term_2024:
        term_2024 = LeadershipTerm(
            title="2024/2025 Administration",
            academic_year="2024/2025",
            theme="Pharmacy United, Impact Amplified.",
            summary="Official executive administration for 2024/2025 academic session.",
            is_current=True,
            sort_order=1,
        )
        db.add(term_2024)
        await db.flush()

    # Ensure leaders exist for President and Vice President
    leader_res = await db.execute(select(Leader).where(Leader.term_id == term_2024.id))
    existing_leaders = list(leader_res.scalars().all())
    if not existing_leaders:
        pres = Leader(
            term_id=term_2024.id,
            full_name="Jacob N. Adjei",
            office="President",
            bio="Leading GPSA-UDS towards greater impact, student welfare advocacy, and academic excellence.",
            email="jacob.adjei@gpsa-uds.edu.gh",
            photo_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            sort_order=1,
            is_active=True,
        )
        vp = Leader(
            term_id=term_2024.id,
            full_name="Abigail K. Mensah",
            office="Vice President",
            bio="Co-ordinating committee operations, internal relations, and strategic project execution.",
            email="abigail.mensah@gpsa-uds.edu.gh",
            photo_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
            sort_order=2,
            is_active=True,
        )
        sec = Leader(
            term_id=term_2024.id,
            full_name="Emmanuel O. Baah",
            office="General Secretary",
            bio="Managing official correspondence, administrative archives, and executive documentation.",
            email="emmanuel.baah@gpsa-uds.edu.gh",
            photo_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
            sort_order=3,
            is_active=True,
        )
        db.add_all([pres, vp, sec])

    # 2. Timeline Events
    timeline_data = [
        {
            "year_label": "2015",
            "title": "Restructuring & System Renewal",
            "summary": "GPSA-UDS restructured its leadership and strengthened governance systems to serve all cohorts.",
            "icon_name": "Building",
            "display_order": 1,
            "status": "published",
        },
        {
            "year_label": "2017",
            "title": "Welfare & Academic Support Launch",
            "summary": "Launch of major welfare and academic support initiatives for all departmental members.",
            "icon_name": "Users",
            "display_order": 2,
            "status": "published",
        },
        {
            "year_label": "2019",
            "title": "National Leadership Recognition",
            "summary": "National recognition for leadership excellence, student advocacy, and community innovation.",
            "icon_name": "Star",
            "display_order": 3,
            "status": "published",
        },
        {
            "year_label": "2021",
            "title": "Outreach & Strategic Partnerships",
            "summary": "Expansion of outreach programmes, rural health screenings, and strategic health partnerships.",
            "icon_name": "TrendingUp",
            "display_order": 4,
            "status": "published",
        },
        {
            "year_label": "2023",
            "title": "Digital Transformation & Engagement",
            "summary": "Digital transformation of student services, resource access, and improved member engagement.",
            "icon_name": "Handshake",
            "display_order": 5,
            "status": "published",
        },
        {
            "year_label": "2025",
            "title": "Legacy of Service & Impact",
            "summary": "Building a stronger legacy of service, integrity, professional excellence, and community impact.",
            "icon_name": "Award",
            "display_order": 6,
            "status": "published",
        },
    ]

    for item in timeline_data:
        res = await db.execute(
            select(LeadershipTimelineEvent).where(LeadershipTimelineEvent.year_label == item["year_label"])
        )
        if not res.scalar_one_or_none():
            db.add(LeadershipTimelineEvent(**item))

    # 3. Recognition Categories
    categories_data = [
        {
            "name": "Outstanding Leaders",
            "slug": "outstanding-leaders",
            "description": "Presidents and key officers who led transformed executive terms.",
            "icon_name": "Trophy",
            "display_order": 1,
        },
        {
            "name": "Distinguished Alumni",
            "slug": "distinguished-alumni",
            "description": "Graduates excelling in clinical practice, research, industry and public service.",
            "icon_name": "GraduationCap",
            "display_order": 2,
        },
        {
            "name": "National GPSA Office Holders",
            "slug": "national-office-holders",
            "description": "Members who represented UDS in National GPSA executive positions.",
            "icon_name": "Building",
            "display_order": 3,
        },
        {
            "name": "Award Winners",
            "slug": "award-winners",
            "description": "Recipients of departmental, university, and national honors.",
            "icon_name": "Award",
            "display_order": 4,
        },
        {
            "name": "International Achievements",
            "slug": "international-achievements",
            "description": "Members securing global fellowships, IPSF roles, and international awards.",
            "icon_name": "Globe",
            "display_order": 5,
        },
        {
            "name": "Committee Champions",
            "slug": "committee-champions",
            "description": "Dedicated committee heads and volunteers driving ground execution.",
            "icon_name": "Users",
            "display_order": 6,
        },
    ]

    cat_map = {}
    for item in categories_data:
        res = await db.execute(
            select(RecognitionCategory).where(RecognitionCategory.slug == item["slug"])
        )
        existing = res.scalar_one_or_none()
        if not existing:
            cat = RecognitionCategory(**item)
            db.add(cat)
            await db.flush()
            cat_map[item["slug"]] = cat
        else:
            cat_map[item["slug"]] = existing

    # 4. Featured Awards
    awards_data = [
        {
            "title": "Best Local Association (GPSA Awards)",
            "slug": "best-local-association-2024",
            "award_year": "2024",
            "category": "National Recognition",
            "recipient_type": "association",
            "recipient_name": "GPSA-UDS",
            "citation": "Awarded for outstanding leadership, active member engagement, and exemplary community contribution to the association nationwide.",
            "image_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
            "image_alt": "Best Local Association Trophy",
            "is_featured": True,
            "display_order": 1,
            "status": "published",
        },
        {
            "title": "Excellence in Community Impact",
            "slug": "excellence-community-impact-2023",
            "award_year": "2023",
            "category": "Public Health & Outreach",
            "recipient_type": "administration",
            "recipient_name": "2023/2024 Executive Board",
            "citation": "For outstanding community outreach, anti-microbial stewardship campaigns, and public health initiatives across northern Ghana.",
            "image_url": "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=600&q=80",
            "image_alt": "Excellence in Community Impact Award Plaque",
            "is_featured": True,
            "display_order": 2,
            "status": "published",
        },
        {
            "title": "Academic Support Excellence Award",
            "slug": "academic-support-excellence-2022",
            "award_year": "2022",
            "category": "Academic Excellence",
            "recipient_type": "committee",
            "recipient_name": "Academic & Research Committee",
            "citation": "Recognised for exceptional academic peer-support programmes, tutorial sessions, and student development resources.",
            "image_url": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
            "image_alt": "Academic Support Excellence Award Certificate",
            "is_featured": True,
            "display_order": 3,
            "status": "published",
        },
        {
            "title": "Innovation in Pharmacy Practice",
            "slug": "innovation-pharmacy-practice-2021",
            "award_year": "2021",
            "category": "Innovation",
            "recipient_type": "association",
            "recipient_name": "GPSA-UDS Research Team",
            "citation": "Honouring innovative student research projects that advanced pharmacy education, clinical practice, and digital patient guidance.",
            "image_url": "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?auto=format&fit=crop&w=600&q=80",
            "image_alt": "Innovation in Pharmacy Practice Trophy",
            "is_featured": True,
            "display_order": 4,
            "status": "published",
        },
    ]

    for item in awards_data:
        res = await db.execute(
            select(LegacyAward).where(LegacyAward.slug == item["slug"])
        )
        if not res.scalar_one_or_none():
            db.add(LegacyAward(**item))

    # Commit all changes
    await db.commit()
    print("Legacy data seeded successfully!")


if __name__ == "__main__":
    async def main():
        async with AsyncSessionLocal() as session:
            await seed_legacy_data(session)

    asyncio.run(main())
