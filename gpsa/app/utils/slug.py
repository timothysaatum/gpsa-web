"""
URL slug generation — used for human-readable identifiers in certificates
and future SEO-friendly news/event URLs.
"""

import uuid

from slugify import slugify as _slugify


def make_slug(text: str, max_length: int = 80) -> str:
    """
    Convert arbitrary text into a URL-safe slug.

    Examples:
        "Mid-Year Congress 2025"  →  "mid-year-congress-2025"
        "Pharmacokinetics (Week 1–6)"  →  "pharmacokinetics-week-1-6"
    """
    return _slugify(text, max_length=max_length, word_boundary=True)


def make_certificate_code(event_slug: str, year: int) -> str:
    """
    Generate a short, human-readable certificate verification code.

    Format: GPSA-{YEAR}-{SLUG_PREFIX}-{SHORT_UUID}
    Example: GPSA-2025-MYC-A3F9

    The short UUID suffix ensures global uniqueness even when two
    certificates share the same event and year.
    """
    prefix = make_slug(event_slug, max_length=8).upper().replace("-", "")[:6]
    suffix = str(uuid.uuid4()).replace("-", "").upper()[:4]
    return f"GPSA-{year}-{prefix}-{suffix}"
