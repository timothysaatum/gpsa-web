import pytest
from pydantic import ValidationError

from app.api.v1.routes.contact import ContactCreateRequest


def valid_payload() -> dict:
    return {
        "full_name": "Ama Student",
        "email": "ama@example.com",
        "category": "general",
        "subject": "Membership enquiry",
        "message": "I would like more information about joining the association.",
        "consent": True,
        "website": "",
    }


def test_contact_submission_accepts_valid_payload():
    payload = ContactCreateRequest.model_validate(valid_payload())
    assert str(payload.email) == "ama@example.com"
    assert payload.message.startswith("I would")


def test_contact_submission_rejects_honeypot_content():
    data = valid_payload()
    data["website"] = "https://spam.example"
    with pytest.raises(ValidationError):
        ContactCreateRequest.model_validate(data)


def test_contact_submission_requires_meaningful_message():
    data = valid_payload()
    data["message"] = "Too short"
    with pytest.raises(ValidationError):
        ContactCreateRequest.model_validate(data)
