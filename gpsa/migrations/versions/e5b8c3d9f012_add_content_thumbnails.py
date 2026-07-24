"""Add academic resource and opportunity thumbnails."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e5b8c3d9f012"
down_revision: str | Sequence[str] | None = "d4f7a2c8e901"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("academic_resources", sa.Column("thumbnail_key", sa.String(length=1000), nullable=True))
    op.add_column("opportunities", sa.Column("thumbnail_key", sa.String(length=1000), nullable=True))


def downgrade() -> None:
    op.drop_column("opportunities", "thumbnail_key")
    op.drop_column("academic_resources", "thumbnail_key")
