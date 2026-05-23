"""Dialect-aware SQLAlchemy column types."""

from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

JSONBCompat = JSONB().with_variant(JSON(), "sqlite")
