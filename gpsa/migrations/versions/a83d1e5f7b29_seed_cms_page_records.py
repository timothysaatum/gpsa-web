"""Seed baseline CMS page records.

Revision ID: a83d1e5f7b29
Revises: f72b5d8e9c31
Create Date: 2026-07-23
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a83d1e5f7b29"
down_revision: str | Sequence[str] | None = "f72b5d8e9c31"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


PAGES = (
    ("home", "Home"),
    ("academics", "Academics"),
    ("events", "Events"),
    ("opportunities", "Opportunities"),
    ("news", "News"),
    ("welfare", "Welfare"),
    ("gallery", "Gallery"),
    ("contact", "Contact"),
    ("leadership", "Leadership"),
    ("past-leadership", "Past Leadership"),
    ("history", "History and Legacy"),
    ("impact", "Impact and Strategic Priorities"),
    ("governance", "Documents and FAQs"),
)


def upgrade() -> None:
    # Empty content intentionally activates the public CMS endpoint while the
    # frontend continues to use its reviewed defaults. Editors can then replace
    # those defaults through the admin site. Existing records are never changed.
    connection = op.get_bind()
    insert_page = sa.text(
        """
        INSERT INTO cms_pages (slug, title, content, is_published, version)
        VALUES (:slug, :title, CAST(:content AS jsonb), true, 1)
        ON CONFLICT (slug) DO NOTHING
        """
    )
    for slug, title in PAGES:
        connection.execute(insert_page, {"slug": slug, "title": title, "content": "{}"})


def downgrade() -> None:
    # Baseline records may have been edited after deployment, so a downgrade
    # must not remove or overwrite CMS content.
    pass
