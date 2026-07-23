"""add impact and strategic priorities CMS

Revision ID: 6d8f1a2b3c4d
Revises: 000ee02cd3df
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "6d8f1a2b3c4d"
down_revision: str | Sequence[str] | None = "000ee02cd3df"
branch_labels = None
depends_on = None

common = [
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    sa.Column("deleted_at", sa.DateTime(timezone=True)),
]


def id_column():
    return sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True)


def status_columns():
    return [
        sa.Column("status", sa.String(30), server_default="draft", nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True)),
    ]


def upgrade() -> None:
    op.create_table("impact_reporting_periods", id_column(), sa.Column("name", sa.String(150), nullable=False), sa.Column("academic_year", sa.String(20), nullable=False), sa.Column("starts_at", sa.Date()), sa.Column("ends_at", sa.Date()), sa.Column("is_current", sa.Boolean(), server_default=sa.text("false"), nullable=False), *status_columns(), *common, sa.UniqueConstraint("academic_year"))
    op.create_index("ix_impact_period_status", "impact_reporting_periods", ["status"])
    op.create_index("uq_impact_period_current", "impact_reporting_periods", ["is_current"], unique=True, postgresql_where=sa.text("is_current = true AND deleted_at IS NULL"))
    op.create_table("strategic_priorities", id_column(), sa.Column("reporting_period_id", sa.UUID(), sa.ForeignKey("impact_reporting_periods.id", ondelete="CASCADE"), nullable=False), sa.Column("title", sa.String(180), nullable=False), sa.Column("slug", sa.String(180), nullable=False, unique=True), sa.Column("description", sa.Text(), nullable=False), sa.Column("icon_name", sa.String(80)), sa.Column("detail_url", sa.String(1000)), *status_columns(), sa.Column("display_order", sa.Integer(), server_default="0", nullable=False), *common)
    op.create_table("impact_metrics", id_column(), sa.Column("reporting_period_id", sa.UUID(), sa.ForeignKey("impact_reporting_periods.id", ondelete="CASCADE"), nullable=False), sa.Column("label", sa.String(180), nullable=False), sa.Column("description", sa.Text()), sa.Column("display_value", sa.String(80), nullable=False), sa.Column("numeric_value", sa.Numeric(18, 2)), sa.Column("prefix", sa.String(20)), sa.Column("suffix", sa.String(20)), sa.Column("icon_name", sa.String(80)), sa.Column("source_reference", sa.Text(), nullable=False), sa.Column("verification_status", sa.String(30), server_default="unverified", nullable=False), *status_columns(), sa.Column("display_order", sa.Integer(), server_default="0", nullable=False), *common)
    op.create_table("impact_focus_areas", id_column(), sa.Column("title", sa.String(180), nullable=False), sa.Column("slug", sa.String(180), nullable=False, unique=True), sa.Column("summary", sa.Text(), nullable=False), sa.Column("description", sa.Text()), sa.Column("image_key", sa.String(1000)), sa.Column("image_url", sa.String(1000)), sa.Column("image_alt", sa.String(500)), sa.Column("icon_name", sa.String(80)), sa.Column("detail_url", sa.String(1000)), *status_columns(), sa.Column("display_order", sa.Integer(), server_default="0", nullable=False), *common)
    op.create_table("impact_initiatives", id_column(), sa.Column("focus_area_id", sa.UUID(), sa.ForeignKey("impact_focus_areas.id", ondelete="CASCADE"), nullable=False), sa.Column("reporting_period_id", sa.UUID(), sa.ForeignKey("impact_reporting_periods.id", ondelete="SET NULL")), sa.Column("title", sa.String(200), nullable=False), sa.Column("slug", sa.String(200), nullable=False, unique=True), sa.Column("summary", sa.Text(), nullable=False), sa.Column("description", sa.Text()), sa.Column("starts_at", sa.Date()), sa.Column("ends_at", sa.Date()), sa.Column("location", sa.String(255)), sa.Column("beneficiary_count", sa.Integer()), sa.Column("image_key", sa.String(1000)), sa.Column("image_url", sa.String(1000)), sa.Column("image_alt", sa.String(500)), *status_columns(), sa.Column("is_featured", sa.Boolean(), server_default=sa.text("false"), nullable=False), sa.Column("display_order", sa.Integer(), server_default="0", nullable=False), *common)
    op.create_table("sdg_goals", id_column(), sa.Column("number", sa.Integer(), nullable=False, unique=True), sa.Column("title", sa.String(180), nullable=False), sa.Column("official_color", sa.String(20), nullable=False), sa.Column("icon_key", sa.String(1000)), sa.Column("official_url", sa.String(1000), nullable=False), sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("deleted_at", sa.DateTime(timezone=True)))
    op.create_table("impact_sdg_alignments", id_column(), sa.Column("sdg_goal_id", sa.UUID(), sa.ForeignKey("sdg_goals.id", ondelete="CASCADE"), nullable=False), sa.Column("reporting_period_id", sa.UUID(), sa.ForeignKey("impact_reporting_periods.id", ondelete="CASCADE"), nullable=False), sa.Column("summary", sa.Text(), nullable=False), sa.Column("evidence", sa.Text(), nullable=False), sa.Column("source_reference", sa.Text(), nullable=False), *status_columns(), sa.Column("display_order", sa.Integer(), server_default="0", nullable=False), *common)
    op.create_table("impact_reports", id_column(), sa.Column("reporting_period_id", sa.UUID(), sa.ForeignKey("impact_reporting_periods.id", ondelete="CASCADE"), nullable=False), sa.Column("title", sa.String(200), nullable=False), sa.Column("slug", sa.String(200), nullable=False, unique=True), sa.Column("description", sa.Text()), sa.Column("file_key", sa.String(1000)), sa.Column("file_name", sa.String(255)), sa.Column("mime_type", sa.String(100)), sa.Column("file_size_bytes", sa.Integer()), sa.Column("version", sa.Integer(), server_default="1", nullable=False), *status_columns(), sa.Column("is_public", sa.Boolean(), server_default=sa.text("false"), nullable=False), *common)
    for table in ("strategic_priorities", "impact_metrics", "impact_focus_areas", "impact_initiatives", "impact_sdg_alignments", "impact_reports"):
        op.create_index(f"ix_{table}_status", table, ["status"])
    for table in ("strategic_priorities", "impact_metrics", "impact_initiatives", "impact_sdg_alignments", "impact_reports"):
        op.create_index(f"ix_{table}_reporting_period_id", table, ["reporting_period_id"])
    op.create_index("ix_impact_initiatives_focus_area_id", "impact_initiatives", ["focus_area_id"])
    op.create_index("ix_impact_sdg_alignments_sdg_goal_id", "impact_sdg_alignments", ["sdg_goal_id"])


def downgrade() -> None:
    for table in ("impact_reports", "impact_sdg_alignments", "sdg_goals", "impact_initiatives", "impact_focus_areas", "impact_metrics", "strategic_priorities"):
        op.drop_table(table)
    op.drop_index("uq_impact_period_current", table_name="impact_reporting_periods")
    op.drop_table("impact_reporting_periods")
