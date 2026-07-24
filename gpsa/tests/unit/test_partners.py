import pytest
from pydantic import ValidationError

from app.api.v1.routes.about import PartnerCreate, PartnerUpdate
from app.models.partner import Partner


def test_partner_model_defaults_are_safe_for_publication() -> None:
    partner = Partner(name="Test Partner")

    assert partner.logo_key is None
    assert partner.logo_url is None
    assert partner.website_url is None


@pytest.mark.parametrize(
    "website_url",
    ["https://example.org", "http://partners.example.org/about"],
)
def test_partner_website_accepts_http_urls(website_url: str) -> None:
    assert PartnerCreate(name="Test Partner", website_url=website_url).website_url == website_url


@pytest.mark.parametrize(
    "website_url",
    ["javascript:alert(1)", "ftp://example.org/logo", "example.org"],
)
def test_partner_website_rejects_unsafe_or_incomplete_urls(website_url: str) -> None:
    with pytest.raises(ValidationError):
        PartnerUpdate(website_url=website_url)

