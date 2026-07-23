"""Normalize governance tag fields to portable JSON.

Revision ID: b42d7f9a5c31
Revises: a31f6e8c4b20
"""
from typing import Sequence
from alembic import op

revision: str = "b42d7f9a5c31"
down_revision: str | Sequence[str] | None = "a31f6e8c4b20"
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Early development installs used varchar[] for these fields. JSON arrays
    # retain the same API shape and keep SQLite-based tests portable.
    op.execute("""
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'governance_documents' AND column_name = 'tags'
          AND data_type = 'ARRAY'
      ) THEN
        ALTER TABLE governance_documents
          ALTER COLUMN tags DROP DEFAULT,
          ALTER COLUMN tags TYPE jsonb USING to_jsonb(tags),
          ALTER COLUMN tags SET DEFAULT '[]'::jsonb;
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'faq_entries' AND column_name = 'keywords'
          AND data_type = 'ARRAY'
      ) THEN
        ALTER TABLE faq_entries
          ALTER COLUMN keywords DROP DEFAULT,
          ALTER COLUMN keywords TYPE jsonb USING to_jsonb(keywords),
          ALTER COLUMN keywords SET DEFAULT '[]'::jsonb;
      END IF;
    END $$;
    """)

def downgrade() -> None:
    pass
