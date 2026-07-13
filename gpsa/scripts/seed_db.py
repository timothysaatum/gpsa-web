#!/usr/bin/env python
"""
Development seed script — populates the DB with realistic test data.

Run ONCE after initial migration:
    python scripts/seed_db.py

Idempotent: skips any records that already exist by checking unique fields.
Do NOT run in production.
"""

import asyncio
import os
import sys
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

# Force development environment for seeding (safety measure)
os.environ.setdefault("ENVIRONMENT", "development")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# ── IMPORTANT: Configure logging BEFORE any other imports that use logger ─────
from app.core.config import settings
from app.core.logging import configure_logging, get_logger   # Use get_logger from logging.py

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.enums import (
    EventStatus,
    EventType,
    NewsCategory,
    OpportunityType,
    ReportStatus,
    ReportType,
    UserRole,
    WelfareCategory,
)
from app.models.event import Event, EventRegistration
from app.models.news import NewsPost
from app.models.opportunity import Opportunity
from app.models.course import Course
from app.models.user import User
from app.models.welfare import WelfareReport, WelfareSpotlight
from sqlalchemy import select

# Configure logging FIRST
configure_logging()

# Create logger using the properly configured get_logger
logger = get_logger("seed_db")


# ── Helpers ───────────────────────────────────────────────────────────────────

async def get_or_create_user(db, **kwargs) -> User:
    result = await db.execute(select(User).where(User.email == kwargs["email"]))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    user = User(**kwargs)
    db.add(user)
    await db.flush()
    return user


async def get_or_create_course(db, **kwargs) -> Course:
    result = await db.execute(select(Course).where(Course.name == kwargs["name"]))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    course = Course(**kwargs)
    db.add(course)
    await db.flush()
    return course


# ── Seed functions ────────────────────────────────────────────────────────────

async def seed_users(db) -> dict[str, User]:
    logger.info("seeding_users")
    users = {}

    users["admin"] = await get_or_create_user(
        db,
        full_name="GPSA-UDS Administrator",
        email="admin@gpsa-uds.edu.gh",
        password_hash=hash_password("Admin1234!"),
        role=UserRole.admin,
        email_verified=True,
        student_id=None,
        level=None,
    )
    users["exec"] = await get_or_create_user(
        db,
        full_name="Abena Mensah",
        email="exec@gpsa-uds.edu.gh",
        password_hash=hash_password("Exec1234!"),
        role=UserRole.exec,
        email_verified=True,
        student_id="UDS/PHARM/EXEC/001",
        level=500,
        phone="+233244000001",
    )
    users["student1"] = await get_or_create_user(
        db,
        full_name="Kwame Asante",
        email="kwame@student.uds.edu.gh",
        password_hash=hash_password("Student1234!"),
        role=UserRole.student,
        email_verified=True,
        student_id="UDS/PHARM/2022/001",
        level=300,
        phone="+233244000002",
    )
    users["student2"] = await get_or_create_user(
        db,
        full_name="Akosua Boateng",
        email="akosua@student.uds.edu.gh",
        password_hash=hash_password("Student1234!"),
        role=UserRole.student,
        email_verified=True,
        student_id="UDS/PHARM/2023/002",
        level=200,
        phone="+233244000003",
    )
    users["student3"] = await get_or_create_user(
        db,
        full_name="Yaw Darko",
        email="yaw@student.uds.edu.gh",
        password_hash=hash_password("Student1234!"),
        role=UserRole.student,
        email_verified=True,
        student_id="UDS/PHARM/2021/003",
        level=400,
    )
    await db.flush()
    logger.info("users_seeded", count=len(users))
    return users


async def seed_courses(db) -> list[Course]:
    logger.info("seeding_courses")
    courses_data = [
        {"name": "Pharmaceutics I", "code": "PHRM101", "level": 100},
        {"name": "Pharmaceutics II", "code": "PHRM201", "level": 200},
        {"name": "Pharmacology I", "code": "PHRM202", "level": 200},
        {"name": "Microbiology for Pharmacy", "code": "PHRM203", "level": 200},
        {"name": "Pharmacokinetics", "code": "PHRM301", "level": 300},
        {"name": "Pharmacology II", "code": "PHRM302", "level": 300},
        {"name": "Clinical Pharmacy", "code": "PHRM401", "level": 400},
        {"name": "Pharmaceutical Chemistry", "code": "PHRM402", "level": 400},
        {"name": "Field Program (TTFPP)", "code": "PHRM501", "level": 500},
        {"name": "Hospital Pharmacy Practice", "code": "PHRM502", "level": 500},
    ]
    courses = []
    for data in courses_data:
        c = await get_or_create_course(db, **data)
        courses.append(c)
    await db.flush()
    logger.info("courses_seeded", count=len(courses))
    return courses


async def seed_events(db, users: dict) -> list[Event]:
    logger.info("seeding_events")
    now = datetime.now(UTC)

    events_data = [
        {
            "title": "Mid-Year Congress (MYC) 2025",
            "description": (
                "The flagship annual congress of GPSA-UDS. All pharmacy students are "
                "expected to attend. Features keynote speakers, committee reports, "
                "academic updates and cultural performances."
            ),
            "event_type": EventType.conference,
            "status": EventStatus.upcoming,
            "start_datetime": now + timedelta(days=1),
            "end_datetime": now + timedelta(days=1, hours=8),
            "location": "UDS Main Auditorium, Tamale",
            "banner_emoji": "🎓",
            "is_featured": True,
            "created_by": users["admin"].id,
        },
        {
            "title": "PharmaCare Community Outreach",
            "description": (
                "GPSA-UDS community health screening and pharmaceutical counselling outreach. "
                "Free BP checks, blood sugar tests, and drug information sessions."
            ),
            "event_type": EventType.outreach,
            "status": EventStatus.upcoming,
            "start_datetime": now + timedelta(days=3),
            "end_datetime": now + timedelta(days=3, hours=6),
            "location": "Tamale Central Hospital, Tamale",
            "banner_emoji": "❤️",
            "is_featured": False,
            "created_by": users["exec"].id,
        },
        {
            "title": "Academic Excellence Workshop",
            "description": (
                "Practical study skills, time management and exam preparation strategies "
                "for Level 200 and Level 300 students."
            ),
            "event_type": EventType.academic,
            "status": EventStatus.upcoming,
            "start_datetime": now + timedelta(days=8),
            "end_datetime": now + timedelta(days=8, hours=4),
            "location": "Faculty of Pharmacy, Room 12",
            "banner_emoji": "📚",
            "is_featured": False,
            "created_by": users["exec"].id,
        },
        {
            "title": "Pharmaceutical Industry Career Fair",
            "description": (
                "Connect with pharmaceutical companies, hospitals and NGOs. "
                "Internship slots, job postings, and networking opportunities."
            ),
            "event_type": EventType.social,
            "status": EventStatus.upcoming,
            "start_datetime": now + timedelta(days=14),
            "end_datetime": now + timedelta(days=14, hours=5),
            "location": "Faculty Boardroom, UDS",
            "banner_emoji": "💼",
            "is_featured": False,
            "created_by": users["exec"].id,
        },
        {
            "title": "Welfare & Mental Health Day 2025",
            "description": (
                "Mental health awareness and peer counselling sessions hosted "
                "by the GPSA Welfare Committee."
            ),
            "event_type": EventType.welfare,
            "status": EventStatus.past,
            "start_datetime": now - timedelta(days=10),
            "end_datetime": now - timedelta(days=10) + timedelta(hours=5),
            "location": "GPSA Office, UDS",
            "banner_emoji": "🌿",
            "is_featured": False,
            "created_by": users["exec"].id,
        },
    ]

    events = []
    for data in events_data:
        result = await db.execute(select(Event).where(Event.title == data["title"]))
        existing = result.scalar_one_or_none()
        if existing:
            events.append(existing)
            continue
        event = Event(**data)
        db.add(event)
        await db.flush()
        events.append(event)

    # Seed a registration for student1 on the first event
    result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == events[0].id,
            EventRegistration.user_id == users["student1"].id,
        )
    )
    if not result.scalar_one_or_none():
        reg = EventRegistration(
            event_id=events[0].id,
            user_id=users["student1"].id,
            full_name=users["student1"].full_name,
            level=users["student1"].level,
            contact=users["student1"].email,
            registered_at=datetime.now(UTC),
        )
        db.add(reg)
        await db.flush()

    logger.info("events_seeded", count=len(events))
    return events


async def seed_opportunities(db, users: dict) -> None:
    logger.info("seeding_opportunities")
    now = datetime.now(UTC)   # Keep this aware

    opps_data = [
        {
            "title": "NHIA Pharmaceutical Internship 2025",
            "organization": "National Health Insurance Authority",
            "opp_type": OpportunityType.internship,
            "description": (
                "3-month paid internship at NHIA regional offices. Open to Level 400–500 "
                "pharmacy students. Gain hands-on experience in pharmaceutical claims and "
                "regulatory affairs."
            ),
            "location": "Accra, Ghana",
            "deadline": date.today() + timedelta(days=14),
            "external_link": "https://nhia.gov.gh/internships",
            "is_published": True,
            "is_active": True,
            "posted_by": users["exec"].id,
            "reviewed_by": users["admin"].id,
            "reviewed_at": now,                    # ← use aware datetime
        },
        {
            "title": "Ghana MoH Scholarship Programme 2025",
            "organization": "Ministry of Health, Ghana",
            "opp_type": OpportunityType.scholarship,
            "description": (
                "Full scholarship for outstanding pharmacy students. Covers tuition, "
                "accommodation and monthly stipend. Apply with your latest transcript."
            ),
            "location": "National",
            "deadline": date.today() + timedelta(days=30),
            "external_link": "https://moh.gov.gh/scholarships",
            "is_published": True,
            "is_active": True,
            "posted_by": users["admin"].id,
            "reviewed_by": users["admin"].id,
            "reviewed_at": now,
        },
        {
            "title": "WHO AFRO Pharmaceutical Fellowship",
            "organization": "World Health Organization – AFRO",
            "opp_type": OpportunityType.training,
            "description": (
                "Competitive fellowship in pharmaceutical policy and regulation for "
                "young pharmacists and final-year students across sub-Saharan Africa."
            ),
            "location": "Brazzaville / Remote",
            "deadline": date.today() + timedelta(days=45),
            "external_link": "https://who.int/afro/fellowships",
            "is_published": True,
            "is_active": True,
            "posted_by": users["admin"].id,
            "reviewed_by": users["admin"].id,
            "reviewed_at": now,
        },
        {
            "title": "GSK Graduate Trainee Programme",
            "organization": "GlaxoSmithKline Ghana",
            "opp_type": OpportunityType.job,
            "description": (
                "Graduate trainee roles in medical affairs and regulatory affairs. "
                "Open to final-year and recently graduated pharmacy students."
            ),
            "location": "Accra, Ghana",
            "deadline": date.today() + timedelta(days=7),
            "external_link": "https://gsk.com/careers",
            "is_published": True,
            "is_active": True,
            "posted_by": users["exec"].id,
            "reviewed_by": users["admin"].id,
            "reviewed_at": now,
        },
    ]

    for data in opps_data:
        result = await db.execute(select(Opportunity).where(Opportunity.title == data["title"]))
        if result.scalar_one_or_none():
            continue
        db.add(Opportunity(**data))

    await db.flush()
    logger.info("opportunities_seeded", count=len(opps_data))


async def seed_news(db, users: dict) -> None:
    logger.info("seeding_news")
    now = datetime.now(UTC)

    posts_data = [
        {
            "title": "MYC 2025 Registration Closes Tomorrow — Don't Miss Out",
            "category": NewsCategory.announcement,
            "summary": (
                "All students are reminded that registration for the Mid-Year Congress "
                "closes tomorrow at 5pm. Late registrations will not be accepted."
            ),
            "body": (
                "This is an official reminder from the GPSA-UDS Secretariat. "
                "The 2025 Mid-Year Congress will be held on April 2nd at the UDS Main Auditorium. "
                "All registered pharmacy students are expected to be present. "
                "Registration closes tomorrow (April 1st) at 17:00 GMT. "
                "Use the Events page to register. Contact the Secretariat for any queries."
            ),
            "banner_emoji": "📢",
            "is_featured": True,
            "is_urgent": True,
            "is_strip_announcement": True,
            "published_at": now - timedelta(hours=3),
            "author_id": users["admin"].id,
        },
        {
            "title": "GPSA Signs MOU with Tamale Teaching Hospital",
            "category": NewsCategory.academic_update,
            "summary": (
                "GPSA-UDS has formalized a Memorandum of Understanding with Tamale Teaching "
                "Hospital to provide structured clinical attachments for pharmacy students."
            ),
            "body": (
                "The Ghana Pharmaceutical Students' Association — University for Development "
                "Studies has signed a landmark MOU with the Tamale Teaching Hospital. "
                "Under this agreement, Level 400–600 students will be placed in structured "
                "6-week clinical rotations across the pharmacy, clinical, and dispensary units. "
                "The MOU was signed by the GPSA President and the Hospital's Chief Pharmacist."
            ),
            "banner_emoji": "🏥",
            "is_featured": False,
            "is_urgent": False,
            "is_strip_announcement": False,
            "published_at": now - timedelta(days=3),
            "author_id": users["exec"].id,
        },
        {
            "title": "Exam Timetable — 2nd Trimester 2025 Released",
            "category": NewsCategory.academic_update,
            "summary": (
                "The Faculty has released the official exam timetable for the 2nd Trimester. "
                "All students are advised to confirm their schedules immediately."
            ),
            "body": (
                "The official 2nd Trimester 2025 examination timetable has been released by "
                "the Faculty of Pharmacy. Exams run from April 21st to May 9th. "
                "Students are advised to check for clashes and report to the Department "
                "within 48 hours. The full timetable is available on the Faculty notice board "
                "and the Academic Resources section of this portal."
            ),
            "banner_emoji": "📅",
            "is_featured": False,
            "is_urgent": False,
            "is_strip_announcement": True,
            "published_at": now - timedelta(days=5),
            "author_id": users["exec"].id,
        },
        {
            "title": "PharmaCare Outreach Recap: Over 200 Patients Screened",
            "category": NewsCategory.events_recap,
            "summary": (
                "The GPSA Outreach Team screened over 200 community members at Tamale "
                "Central Market. Read the full recap here."
            ),
            "body": (
                "The March edition of the GPSA-UDS PharmaCare Community Outreach was a "
                "resounding success. Over 200 community members were screened for hypertension, "
                "diabetes and malaria at the Tamale Central Market. "
                "The team of 30 students administered over 150 drug counselling sessions. "
                "The next outreach is scheduled for April 3rd at Tamale Central Hospital."
            ),
            "banner_emoji": "❤️",
            "is_featured": False,
            "is_urgent": False,
            "is_strip_announcement": False,
            "published_at": now - timedelta(days=12),
            "author_id": users["exec"].id,
        },
    ]

    for data in posts_data:
        result = await db.execute(select(NewsPost).where(NewsPost.title == data["title"]))
        if result.scalar_one_or_none():
            continue
        db.add(NewsPost(**data))

    await db.flush()
    logger.info("news_seeded", count=len(posts_data))


async def seed_welfare(db) -> None:
    logger.info("seeding_welfare")

    # Spotlight
    result = await db.execute(select(WelfareSpotlight).where(WelfareSpotlight.is_active.is_(True)))
    if not result.scalar_one_or_none():
        db.add(WelfareSpotlight(
            summary=(
                "Multiple Level 300 students reported difficulties accessing lab chemicals "
                "for practicals due to supply chain delays in the Faculty store."
            ),
            action_taken=(
                "The GPSA Academic Officer has formally raised this with the Faculty Dean. "
                "A response is expected by end of week."
            ),
            is_active=True,
        ))
        await db.flush()

    # Sample reports
    reports_data = [
        {
            "report_type": ReportType.issue,
            "category": WelfareCategory.academic,
            "description": "Lab chemicals for Level 300 practicals have not been restocked for 3 weeks.",
            "is_anonymous": False,
            "name": "Kwame Asante",
            "level": 300,
            "status": ReportStatus.in_review,
            "submitted_at": datetime.now(UTC) - timedelta(days=5),
        },
        {
            "report_type": ReportType.confidential,
            "category": WelfareCategory.welfare,
            "description": "I am experiencing significant academic pressure and need counselling support.",
            "is_anonymous": True,
            "name": None,
            "level": None,
            "status": ReportStatus.pending,
            "submitted_at": datetime.now(UTC) - timedelta(days=2),
        },
        {
            "report_type": ReportType.support,
            "category": WelfareCategory.financial,
            "description": "I need help accessing the emergency student fund for accommodation.",
            "is_anonymous": False,
            "name": "Akosua Boateng",
            "level": 200,
            "status": ReportStatus.resolved,
            "submitted_at": datetime.now(UTC) - timedelta(days=10),
        },
    ]

    for data in reports_data:
        db.add(WelfareReport(**data))

    await db.flush()
    logger.info("welfare_seeded")


# ── Entry point ───────────────────────────────────────────────────────────────

async def seed() -> None:
    if settings.is_production:
        print("❌  Refusing to seed a production database. Set ENVIRONMENT=development.")
        return

    async with AsyncSessionLocal() as db:
        try:
            users = await seed_users(db)
            await seed_courses(db)
            await seed_events(db, users)
            await seed_opportunities(db, users)
            await seed_news(db, users)
            await seed_welfare(db)
            await db.commit()
            print(
                "\n✅  Database seeded successfully.\n\n"
                "   Login credentials:\n"
                "   Admin  → admin@gpsa-uds.edu.gh  / Admin1234!\n"
                "   Exec   → exec@gpsa-uds.edu.gh   / Exec1234!\n"
                "   Student→ kwame@student.uds.edu.gh / Student1234!\n"
            )
        except Exception as exc:
            await db.rollback()
            logger.exception("Database seeding failed with error")
            print(f"\n❌  Seeding failed: {exc}")
            raise


if __name__ == "__main__":
    asyncio.run(seed())