"""add_gallery_images

Revision ID: 7b6c2f1a9d03
Revises: ec3c66ef1a49
Create Date: 2026-07-18 05:18:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "7b6c2f1a9d03"
down_revision: str | Sequence[str] | None = "ec3c66ef1a49"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "gallery_images",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("image_url", sa.String(length=1000), nullable=False),
        sa.Column("thumbnail_url", sa.String(length=1000), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_gallery_images_category", "gallery_images", ["category"], unique=False)
    op.create_index("ix_gallery_images_sort_created", "gallery_images", ["sort_order", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_gallery_images_sort_created", table_name="gallery_images")
    op.drop_index("ix_gallery_images_category", table_name="gallery_images")
    op.drop_table("gallery_images")
