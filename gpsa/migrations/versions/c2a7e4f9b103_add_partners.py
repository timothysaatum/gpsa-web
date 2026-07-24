"""add deployable partner management

Revision ID: c2a7e4f9b103
Revises: b94e2f6a8c30
Create Date: 2026-07-23 18:30:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c2a7e4f9b103"
down_revision: str | Sequence[str] | None = "b94e2f6a8c30"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "partners",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("logo_key", sa.String(length=1000), nullable=True),
        sa.Column("logo_url", sa.String(length=1000), nullable=True),
        sa.Column("website_url", sa.String(length=1000), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_partners_published_sort",
        "partners",
        ["is_published", "sort_order"],
        unique=False,
    )

    partners = sa.table(
        "partners",
        sa.column("name", sa.String),
        sa.column("sort_order", sa.Integer),
        sa.column("is_published", sa.Boolean),
    )
    op.bulk_insert(
        partners,
        [
            {"name": "University for Development Studies", "sort_order": 0, "is_published": True},
            {"name": "School of Pharmacy", "sort_order": 1, "is_published": True},
            {"name": "National GPSA", "sort_order": 2, "is_published": True},
            {"name": "Pharmaceutical Society of Ghana", "sort_order": 3, "is_published": True},
            {"name": "Pharmacy Council", "sort_order": 4, "is_published": True},
            {"name": "Korle Bu Teaching Hospital", "sort_order": 5, "is_published": True},
            {"name": "Medochemie Ghana Ltd.", "sort_order": 6, "is_published": True},
            {"name": "Ernest Chemists Foundation", "sort_order": 7, "is_published": True},
            {"name": "GSK Ghana", "sort_order": 8, "is_published": True},
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_partners_published_sort", table_name="partners")
    op.drop_table("partners")
