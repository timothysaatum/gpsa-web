"""Repair missing administration-to-term links.

Revision ID: c53e8a0b6d42
Revises: b42d7f9a5c31

Early development databases created ``leadership_administrations`` before its
``term_id`` relationship was finalized, then were stamped past the migration
that introduced it. Preserve those records by deriving corresponding terms
from their existing institutional metadata before enforcing the relationship.
"""
from typing import Sequence

from alembic import op

revision: str = "c53e8a0b6d42"
down_revision: str | Sequence[str] | None = "b42d7f9a5c31"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE leadership_administrations "
        "ADD COLUMN IF NOT EXISTS term_id uuid"
    )
    op.execute(
        """
        INSERT INTO leadership_terms (
          id, title, academic_year, start_date, end_date, theme, summary,
          is_current, sort_order, created_at, updated_at, deleted_at
        )
        SELECT
          gen_random_uuid(), a.title, a.academic_year, a.starts_at, a.ends_at,
          a.theme, a.summary, a.is_current, a.display_order,
          a.created_at, a.updated_at, NULL
        FROM leadership_administrations a
        WHERE a.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM leadership_terms t
            WHERE t.academic_year = a.academic_year
              AND t.deleted_at IS NULL
          )
        """
    )
    op.execute(
        """
        UPDATE leadership_administrations a
        SET term_id = t.id
        FROM leadership_terms t
        WHERE a.term_id IS NULL
          AND t.academic_year = a.academic_year
          AND t.deleted_at IS NULL
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM leadership_administrations WHERE term_id IS NULL
          ) THEN
            RAISE EXCEPTION
              'Cannot repair leadership_administrations: unmatched term rows remain';
          END IF;
        END $$
        """
    )
    op.execute(
        "ALTER TABLE leadership_administrations "
        "ALTER COLUMN term_id SET NOT NULL"
    )
    op.execute(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'fk_leadership_administrations_term_id'
          ) THEN
            ALTER TABLE leadership_administrations
              ADD CONSTRAINT fk_leadership_administrations_term_id
              FOREIGN KEY (term_id) REFERENCES leadership_terms(id)
              ON DELETE CASCADE;
          END IF;
        END $$
        """
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS "
        "ix_leadership_administrations_term_id "
        "ON leadership_administrations (term_id)"
    )


def downgrade() -> None:
    # The generated term records may subsequently acquire leaders or other
    # official content. Retain the repaired relationship and data.
    pass
