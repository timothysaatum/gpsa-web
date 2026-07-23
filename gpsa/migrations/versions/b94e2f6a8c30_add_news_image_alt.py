"""Add accessible alternative text for news images.

Revision ID: b94e2f6a8c30
Revises: a83d1e5f7b29
Create Date: 2026-07-23
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b94e2f6a8c30"
down_revision: str | Sequence[str] | None = "a83d1e5f7b29"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("news_posts", sa.Column("image_alt", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("news_posts", "image_alt")
