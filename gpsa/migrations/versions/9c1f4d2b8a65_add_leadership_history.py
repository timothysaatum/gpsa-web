"""add_leadership_history

Revision ID: 9c1f4d2b8a65
Revises: 7b6c2f1a9d03
Create Date: 2026-07-18 05:31:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "9c1f4d2b8a65"
down_revision: str | Sequence[str] | None = "7b6c2f1a9d03"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "leadership_terms",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("academic_year", sa.String(length=20), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("theme", sa.String(length=255), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("is_current", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_leadership_terms_academic_year", "leadership_terms", ["academic_year"], unique=False)
    op.create_index("ix_leadership_terms_is_current", "leadership_terms", ["is_current"], unique=False)
    op.create_index("ix_leadership_terms_sort_order", "leadership_terms", ["sort_order"], unique=False)

    op.create_table(
        "leaders",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("term_id", sa.UUID(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("office", sa.String(length=180), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("photo_key", sa.String(length=1000), nullable=True),
        sa.Column("photo_url", sa.String(length=1000), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["term_id"], ["leadership_terms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_leaders_term_id", "leaders", ["term_id"], unique=False)
    op.create_index("ix_leaders_office", "leaders", ["office"], unique=False)
    op.create_index("ix_leaders_is_active", "leaders", ["is_active"], unique=False)
    op.create_index("ix_leaders_sort_order", "leaders", ["sort_order"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_leaders_sort_order", table_name="leaders")
    op.drop_index("ix_leaders_is_active", table_name="leaders")
    op.drop_index("ix_leaders_office", table_name="leaders")
    op.drop_index("ix_leaders_term_id", table_name="leaders")
    op.drop_table("leaders")
    op.drop_index("ix_leadership_terms_sort_order", table_name="leadership_terms")
    op.drop_index("ix_leadership_terms_is_current", table_name="leadership_terms")
    op.drop_index("ix_leadership_terms_academic_year", table_name="leadership_terms")
    op.drop_table("leadership_terms")
