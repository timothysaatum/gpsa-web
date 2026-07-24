"""Add managed leadership offices.

Revision ID: d4f7a2c8e901
Revises: c2a7e4f9b103
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d4f7a2c8e901"
down_revision: str | Sequence[str] | None = "c2a7e4f9b103"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "leadership_offices",
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_leadership_offices_name", "leadership_offices", ["name"], unique=True)
    op.create_index("ix_leadership_offices_is_active", "leadership_offices", ["is_active"])
    op.execute(
        """
        INSERT INTO leadership_offices (id, name, sort_order, is_active, created_at, updated_at)
        SELECT gen_random_uuid(), office, MIN(sort_order), true, now(), now()
        FROM leaders
        WHERE deleted_at IS NULL AND trim(office) <> ''
        GROUP BY office
        ON CONFLICT (name) DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_index("ix_leadership_offices_is_active", table_name="leadership_offices")
    op.drop_index("ix_leadership_offices_name", table_name="leadership_offices")
    op.drop_table("leadership_offices")
