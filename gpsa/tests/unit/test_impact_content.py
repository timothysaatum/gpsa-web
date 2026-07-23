import pytest
from fastapi import HTTPException

from app.api.v1.routes.impact import _clean


def test_published_metric_must_be_verified():
    with pytest.raises(HTTPException) as exc:
        _clean(
            "metrics",
            {
                "label": "People reached",
                "display_value": "100",
                "source_reference": "Annual report",
                "verification_status": "unverified",
                "status": "published",
            },
            {"label", "display_value", "source_reference", "verification_status", "status"},
        )
    assert exc.value.status_code == 422


def test_published_metric_requires_source():
    with pytest.raises(HTTPException) as exc:
        _clean(
            "metrics",
            {
                "label": "People reached",
                "display_value": "100",
                "verification_status": "verified",
                "status": "published",
            },
            {"label", "display_value", "source_reference", "verification_status", "status"},
        )
    assert "source" in str(exc.value.detail).lower()


def test_draft_metric_can_remain_unverified():
    result = _clean(
        "metrics",
        {
            "label": "People reached",
            "display_value": "To be confirmed",
            "source_reference": "",
            "verification_status": "unverified",
            "status": "draft",
        },
        {"label", "display_value", "source_reference", "verification_status", "status"},
    )
    assert result["status"] == "draft"


def test_published_focus_image_requires_alt_text():
    with pytest.raises(HTTPException) as exc:
        _clean(
            "focus-areas",
            {"title": "Outreach", "status": "published", "image_url": "https://example.test/image.jpg"},
            {"title", "status", "image_url", "image_alt"},
        )
    assert "alternative text" in str(exc.value.detail)
