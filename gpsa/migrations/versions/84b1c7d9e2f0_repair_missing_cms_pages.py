"""Repair a missing CMS pages table.

Revision ID: 84b1c7d9e2f0
Revises: 6d8f1a2b3c4d
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "84b1c7d9e2f0"
down_revision: str | Sequence[str] | None = "6d8f1a2b3c4d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Some development databases were stamped with 000ee02cd3df before this
    # table from that migration was actually created.
    if "cms_pages" in sa.inspect(op.get_bind()).get_table_names():
        return

    op.create_table(
        "cms_pages",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column(
            "content",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("is_published", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("version", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_cms_pages_is_published", "cms_pages", ["is_published"], unique=False)
    op.create_index("ix_cms_pages_slug", "cms_pages", ["slug"], unique=True)


def downgrade() -> None:
    # The table may contain CMS data unrelated to Impact. Do not destroy it
    # when reversing this schema-repair revision.
    pass
