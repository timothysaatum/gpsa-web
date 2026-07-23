import pytest
from fastapi import HTTPException

from app.api.v1.routes.governance import _clean


def test_rejects_negative_display_order():
    with pytest.raises(HTTPException) as exc:
        _clean("categories", {"display_order": -1}, {"display_order"})
    assert exc.value.status_code == 422


def test_rejects_unsafe_external_url():
    with pytest.raises(HTTPException) as exc:
        _clean("documents", {"external_url": "javascript:alert(1)"}, {"external_url"})
    assert "URL" in str(exc.value.detail)


def test_published_content_receives_timestamp():
    data = _clean("faqs", {"status": "published"}, {"status", "published_at"})
    assert data["published_at"] is not None


def test_rejects_unknown_fields():
    with pytest.raises(HTTPException) as exc:
        _clean("documents", {"internal_note": "private"}, {"title"})
    assert exc.value.status_code == 422
