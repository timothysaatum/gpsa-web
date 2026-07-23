"""add gallery publication and storage key

Revision ID: e61a4c9d7b20
Revises: c53e8a0b6d42
Create Date: 2026-07-23
"""

import sqlalchemy as sa
from alembic import op

revision = "e61a4c9d7b20"
down_revision = "c53e8a0b6d42"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("gallery_images", sa.Column("image_key", sa.String(length=1000), nullable=True))
    op.add_column(
        "gallery_images",
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column("gallery_images", "is_published", server_default=None)


def downgrade() -> None:
    op.drop_column("gallery_images", "is_published")
    op.drop_column("gallery_images", "image_key")
