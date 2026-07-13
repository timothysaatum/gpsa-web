"""Unit tests for utility modules — no DB required."""

from datetime import date, timedelta

import pytest

from app.utils.date_helpers import days_until, deadline_urgency, event_urgency
from app.utils.file_validation import (
    FileValidationError,
    validate_academic_file,
    validate_image_file,
)
from app.utils.pagination import PaginationParams, paginate
from app.utils.slug import make_certificate_code, make_slug


# ── Date helpers ──────────────────────────────────────────────────────────────

class TestDateHelpers:
    def test_days_until_future(self):
        future = date.today() + timedelta(days=5)
        assert days_until(future) == 5

    def test_days_until_past(self):
        past = date.today() - timedelta(days=3)
        assert days_until(past) == -3

    def test_days_until_today(self):
        assert days_until(date.today()) == 0

    def test_deadline_urgency_closing_today(self):
        assert deadline_urgency(date.today()) == "closing_today"

    def test_deadline_urgency_closing_soon(self):
        assert deadline_urgency(date.today() + timedelta(days=5)) == "closing_soon"

    def test_deadline_urgency_open(self):
        assert deadline_urgency(date.today() + timedelta(days=30)) == "open"

    def test_deadline_urgency_expired(self):
        assert deadline_urgency(date.today() - timedelta(days=1)) == "expired"


# ── Slug ──────────────────────────────────────────────────────────────────────

class TestSlug:
    def test_basic_slug(self):
        assert make_slug("Mid-Year Congress 2025") == "mid-year-congress-2025"

    def test_slug_strips_special_chars(self):
        slug = make_slug("Pharmacokinetics (Week 1–6)")
        assert "(" not in slug
        assert ")" not in slug

    def test_slug_max_length(self):
        long_text = "A " * 100
        assert len(make_slug(long_text, max_length=20)) <= 20

    def test_certificate_code_format(self):
        code = make_certificate_code("myc", 2025)
        parts = code.split("-")
        assert parts[0] == "GPSA"
        assert parts[1] == "2025"
        assert len(parts) == 4

    def test_certificate_code_unique(self):
        codes = {make_certificate_code("myc", 2025) for _ in range(50)}
        assert len(codes) == 50


# ── File validation ───────────────────────────────────────────────────────────

class TestFileValidation:
    def _make_pdf_bytes(self) -> bytes:
        """Minimal valid PDF magic bytes."""
        return b"%PDF-1.4\n" + b"x" * 100

    def test_empty_file_raises(self):
        with pytest.raises(FileValidationError, match="empty"):
            validate_academic_file(b"", "file.pdf")

    def test_oversized_file_raises(self):
        huge = b"%PDF-1.4\n" + b"x" * (55 * 1024 * 1024)
        with pytest.raises(FileValidationError, match="size"):
            validate_academic_file(huge, "big.pdf")


# ── Pagination ────────────────────────────────────────────────────────────────

class TestPagination:
    def test_paginate_wraps_items(self):
        params = PaginationParams(offset=0, limit=10)
        result = paginate(["a", "b", "c"], total=100, params=params)
        assert result.items == ["a", "b", "c"]
        assert result.total == 100
        assert result.has_more is True

    def test_has_more_false_on_last_page(self):
        params = PaginationParams(offset=90, limit=10)
        result = paginate(list(range(10)), total=100, params=params)
        assert result.has_more is False

    def test_default_limit(self):
        params = PaginationParams()
        assert params.limit == 20
        assert params.offset == 0
