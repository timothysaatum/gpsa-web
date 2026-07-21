"""Domain value objects — immutable, self-validating primitives.

Each class wraps a single value and validates it at construction time.
This guarantees that invalid data cannot enter the domain layer.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from .kernel import ValueObject

# ── Auth / User ────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Email(ValueObject):
    value: str

    def __post_init__(self) -> None:
        if not self.value or len(self.value) > 255:
            raise ValueError("Email must be 1–255 characters")
        if "@" not in self.value or "." not in self.value.split("@")[-1]:
            msg = f"Invalid email format: {self.value}"
            raise ValueError(msg)

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class PasswordHash(ValueObject):
    value: str

    def __post_init__(self) -> None:
        if not self.value:
            raise ValueError("Password hash must not be empty")

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class PhoneNumber(ValueObject):
    value: str

    def __post_init__(self) -> None:
        cleaned = re.sub(r"[\s\-\(\)\+\.]", "", self.value)
        if not re.match(r"^\d{7,15}$", cleaned):
            msg = f"Invalid phone number: {self.value}"
            raise ValueError(msg)

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class StudentId(ValueObject):
    value: str

    def __post_init__(self) -> None:
        if self.value and not re.match(r"^[A-Z0-9]{3,20}$", self.value.upper()):
            msg = f"Invalid student ID format: {self.value}"
            raise ValueError(msg)

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class FullName(ValueObject):
    value: str

    def __post_init__(self) -> None:
        if not self.value or len(self.value) > 255:
            raise ValueError("Full name must be 1–255 characters")

    def __str__(self) -> str:
        return self.value


# ── General ────────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class URL(ValueObject):
    value: str

    def __post_init__(self) -> None:
        if not re.match(r"^https?://", self.value):
            msg = f"URL must start with http:// or https://: {self.value}"
            raise ValueError(msg)
        if len(self.value) > 2048:
            raise ValueError("URL must not exceed 2048 characters")

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class Rating(ValueObject):
    value: int

    def __post_init__(self) -> None:
        if not 1 <= self.value <= 5:
            msg = f"Rating must be 1–5, got {self.value}"
            raise ValueError(msg)

    def __int__(self) -> int:
        return self.value


@dataclass(frozen=True)
class FileSize(ValueObject):
    bytes: int

    def __post_init__(self) -> None:
        if self.bytes < 0:
            msg = f"File size must be non-negative, got {self.bytes}"
            raise ValueError(msg)

    def __int__(self) -> int:
        return self.bytes

    @property
    def megabytes(self) -> float:
        return self.bytes / (1024 * 1024)


# ── Certificates ───────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class VerificationCode(ValueObject):
    value: str

    def __post_init__(self) -> None:
        if not re.match(r"^GPSA-\d{4}-[A-Z0-9]{4,8}$", self.value):
            msg = f"Invalid verification code format: {self.value}"
            raise ValueError(msg)

    def __str__(self) -> str:
        return self.value
