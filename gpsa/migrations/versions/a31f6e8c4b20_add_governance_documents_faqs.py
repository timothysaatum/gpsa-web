"""Add governance documents and FAQs.

Revision ID: a31f6e8c4b20
Revises: 84b1c7d9e2f0
"""
from typing import Sequence
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a31f6e8c4b20"
down_revision: str | Sequence[str] | None = "84b1c7d9e2f0"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table("document_categories",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False), sa.Column("slug", sa.String(120), nullable=False),
        sa.Column("description", sa.Text()), sa.Column("icon_name", sa.String(80)),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)), sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("slug"))
    op.create_index("ix_document_categories_slug", "document_categories", ["slug"], unique=True)
    op.create_index("ix_document_categories_is_active", "document_categories", ["is_active"])
    op.create_table("governance_documents",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("category_id", sa.UUID(), nullable=False), sa.Column("title", sa.String(240), nullable=False),
        sa.Column("slug", sa.String(240), nullable=False), sa.Column("description", sa.Text()),
        sa.Column("document_type", sa.String(80), nullable=False), sa.Column("version", sa.String(40)),
        sa.Column("edition", sa.String(80)), sa.Column("academic_year", sa.String(20)),
        sa.Column("publication_date", sa.Date()), sa.Column("effective_date", sa.Date()), sa.Column("review_date", sa.Date()),
        sa.Column("file_key", sa.String(1000)), sa.Column("external_url", sa.String(1000)),
        sa.Column("file_name", sa.String(255)), sa.Column("mime_type", sa.String(150)),
        sa.Column("file_extension", sa.String(20)), sa.Column("file_size_bytes", sa.Integer()),
        sa.Column("checksum", sa.String(64)), sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("is_public", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("requires_authentication", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("download_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("view_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("status", sa.String(30), server_default="draft", nullable=False),
        sa.Column("verification_status", sa.String(30), server_default="unverified", nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)), sa.ForeignKeyConstraint(["category_id"], ["document_categories.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("slug"))
    for name, cols in [("category_id",["category_id"]),("slug",["slug"]),("academic_year",["academic_year"]),("publication_date",["publication_date"]),("is_public",["is_public"]),("status",["status"]),("verification_status",["verification_status"])]:
        op.create_index(f"ix_governance_documents_{name}", "governance_documents", cols, unique=name=="slug")
    op.create_table("document_versions",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("document_id", sa.UUID(), nullable=False), sa.Column("version", sa.String(40), nullable=False),
        sa.Column("edition", sa.String(80)), sa.Column("file_key", sa.String(1000), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False), sa.Column("mime_type", sa.String(150), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False), sa.Column("checksum", sa.String(64), nullable=False),
        sa.Column("change_summary", sa.Text()), sa.Column("is_current", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("status", sa.String(30), server_default="draft", nullable=False), sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["governance_documents.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "version", name="uq_document_version"))
    op.create_index("ix_document_versions_document_id", "document_versions", ["document_id"])
    op.create_index("ix_document_versions_is_current", "document_versions", ["is_current"])
    for table in ("faq_categories",):
        op.create_table(table, sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
            sa.Column("name", sa.String(120), nullable=False), sa.Column("slug", sa.String(120), nullable=False),
            sa.Column("description", sa.Text()), sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
            sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("deleted_at", sa.DateTime(timezone=True)), sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("slug"))
    op.create_index("ix_faq_categories_slug", "faq_categories", ["slug"], unique=True)
    op.create_index("ix_faq_categories_is_active", "faq_categories", ["is_active"])
    op.create_table("faq_entries",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("category_id", sa.UUID()), sa.Column("question", sa.String(500), nullable=False),
        sa.Column("slug", sa.String(240), nullable=False), sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("short_answer", sa.Text()), sa.Column("keywords", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("related_url", sa.String(1000)), sa.Column("status", sa.String(30), server_default="draft", nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_featured", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True)), sa.ForeignKeyConstraint(["category_id"], ["faq_categories.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("slug"))
    for name in ("category_id","slug","status","is_featured"):
        op.create_index(f"ix_faq_entries_{name}", "faq_entries", [name], unique=name=="slug")

def downgrade() -> None:
    op.drop_table("faq_entries"); op.drop_table("faq_categories")
    op.drop_table("document_versions"); op.drop_table("governance_documents"); op.drop_table("document_categories")
