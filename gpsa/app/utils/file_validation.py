"""
File validation utility.

Validates uploaded files by checking BOTH:
  1. The declared Content-Type / filename extension
  2. The actual file magic bytes (first ~262 bytes of the file)

This prevents attackers from renaming a .exe to .pdf and
uploading it through the academic resources endpoint.

Requires: python-magic (libmagic bindings)
"""

from dataclasses import dataclass

import magic

from app.models.enums import FileType

# ── Allowed MIME types per content context ────────────────────────────────────

ACADEMIC_ALLOWED: dict[str, FileType] = {
    "application/pdf": FileType.pdf,
    "application/msword": FileType.doc,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileType.doc,
    "application/vnd.ms-powerpoint": FileType.doc,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": FileType.doc,
    "video/mp4": FileType.video,
    "video/webm": FileType.video,
    "video/quicktime": FileType.video,
}

IMAGE_ALLOWED: dict[str, FileType] = {
    "image/jpeg": FileType.image,
    "image/png": FileType.image,
    "image/webp": FileType.image,
    "image/gif": FileType.image,
}

ATTACHMENT_ALLOWED: dict[str, FileType] = {
    **ACADEMIC_ALLOWED,
    **IMAGE_ALLOWED,
}

# Maximum file sizes
MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


@dataclass
class ValidatedFile:
    mime_type: str
    file_type: FileType
    size_bytes: int
    content: bytes


class FileValidationError(ValueError):
    pass


def validate_file(
    content: bytes,
    filename: str,
    allowed: dict[str, FileType],
    max_bytes: int,
) -> ValidatedFile:
    """
    Validate file content against allowed MIME types and size limits.

    Args:
        content:   Raw file bytes.
        filename:  Original filename (used only for error messages).
        allowed:   Dict mapping allowed MIME type strings → FileType enum.
        max_bytes: Maximum allowed file size in bytes.

    Returns:
        ValidatedFile with resolved mime_type and FileType.

    Raises:
        FileValidationError on any validation failure.
    """
    size = len(content)

    if size == 0:
        raise FileValidationError("File is empty.")

    if size > max_bytes:
        mb = max_bytes // (1024 * 1024)
        raise FileValidationError(f"File exceeds the maximum allowed size of {mb} MB.")

    # Detect actual MIME type from magic bytes — not from the filename
    detected_mime = magic.from_buffer(content[:2048], mime=True)

    if detected_mime not in allowed:
        allowed_list = ", ".join(sorted(allowed.keys()))
        raise FileValidationError(
            f"File type '{detected_mime}' is not allowed. Accepted types: {allowed_list}."
        )

    return ValidatedFile(
        mime_type=detected_mime,
        file_type=allowed[detected_mime],
        size_bytes=size,
        content=content,
    )


def validate_academic_file(content: bytes, filename: str) -> ValidatedFile:
    max_bytes = MAX_VIDEO_SIZE_BYTES if "video" in filename.lower() else MAX_DOCUMENT_SIZE_BYTES
    return validate_file(content, filename, ACADEMIC_ALLOWED, max_bytes)


def validate_image_file(content: bytes, filename: str) -> ValidatedFile:
    return validate_file(content, filename, IMAGE_ALLOWED, MAX_IMAGE_SIZE_BYTES)


def validate_attachment_file(content: bytes, filename: str) -> ValidatedFile:
    return validate_file(content, filename, ATTACHMENT_ALLOWED, MAX_ATTACHMENT_SIZE_BYTES)
