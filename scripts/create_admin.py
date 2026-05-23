#!/usr/bin/env python
"""
Bootstrap script — creates the first admin user from .env settings.

Run once after the initial migration:

    python scripts/create_admin.py

Idempotent: if an admin with that email already exists, it skips creation.
"""

import asyncio
import sys
from pathlib import Path

# Ensure project root is on sys.path when run directly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import UTC, datetime

from sqlalchemy import select

from app.core.config import settings
from app.core.logging import configure_logging
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.enums import UserRole
from app.models.user import User

configure_logging()

import structlog
logger = structlog.get_logger(__name__)


async def create_first_admin() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == settings.first_admin_email)
        )
        existing = result.scalar_one_or_none()

        if existing:
            logger.info(
                "admin_already_exists",
                email=settings.first_admin_email,
                role=existing.role,
            )
            return

        admin = User(
            full_name="GPSA-UDS Administrator",
            email=settings.first_admin_email,
            password_hash=hash_password(settings.first_admin_password),
            role=UserRole.admin,
            email_verified=True,
            last_login_at=None,
        )
        db.add(admin)
        await db.commit()
        await db.refresh(admin)

        logger.info(
            "admin_created",
            id=str(admin.id),
            email=admin.email,
        )
        print(
            f"\n✅  Admin user created\n"
            f"    Email:    {admin.email}\n"
            f"    Password: {settings.first_admin_password}\n"
            f"\n⚠️   Change the password immediately after first login.\n"
        )


if __name__ == "__main__":
    asyncio.run(create_first_admin())
