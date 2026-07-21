"""
Storage service — Cloudflare R2 / AWS S3 abstraction.

All file I/O with object storage goes through this class.
The rest of the codebase never touches boto3 directly.

Key design decisions:
  - Object keys are stored in the DB; public URLs are resolved at the API
    response layer using presign() or cdn_url(), never stored in the DB.
  - Uploads are validated BEFORE this service is called (see file_validation.py).
  - All methods are async-friendly via run_in_executor for the sync boto3 client.
"""

import uuid
from datetime import UTC, datetime
from functools import cached_property
from pathlib import PurePosixPath

import boto3
import structlog
from botocore.exceptions import ClientError

from app.core.config import settings

logger = structlog.get_logger(__name__)


def _build_object_key(folder: str, filename: str) -> str:
    """
    Construct a deterministic, collision-resistant object key.

    Pattern: {folder}/{year}/{month}/{uuid}_{filename}
    Example: academic/2025/04/3f1a9b-pharmacokinetics-slides.pdf
    """
    now = datetime.now(UTC)
    safe_filename = PurePosixPath(filename).name  # strip any path traversal
    uid = str(uuid.uuid4())[:8]
    return f"{folder}/{now.year}/{now.month:02d}/{uid}_{safe_filename}"


class StorageService:
    """
    Thin async-compatible wrapper around boto3 S3 client.

    Cloudflare R2 is S3-compatible — same API, different endpoint URL.
    Switching to AWS S3 requires only changing the env vars.
    """

    @cached_property
    def _client(self):  # type: ignore[return]
        return boto3.client(
            "s3",
            endpoint_url=settings.storage_endpoint_url,
            aws_access_key_id=settings.storage_access_key_id,
            aws_secret_access_key=settings.storage_secret_access_key,
            region_name="auto",  # R2 uses "auto"; for AWS use your region
        )

    # ── Upload ────────────────────────────────────────────────────────────────

    async def upload(
        self,
        content: bytes,
        folder: str,
        filename: str,
        mime_type: str,
        public: bool = False,
    ) -> str:
        """
        Upload bytes to object storage.

        Returns the object key (not a URL — resolve with presign() or cdn_url()).
        """
        import asyncio

        key = _build_object_key(folder, filename)
        extra_args: dict = {"ContentType": mime_type}
        if public:
            extra_args["ACL"] = "public-read"

        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                lambda: self._client.put_object(
                    Bucket=settings.storage_bucket_name,
                    Key=key,
                    Body=content,
                    **extra_args,
                ),
            )
            logger.info("storage_upload_ok", key=key, size=len(content))
            return key
        except ClientError as exc:
            logger.error("storage_upload_failed", key=key, error=str(exc))
            raise

    # ── Presigned URL (private files) ─────────────────────────────────────────

    async def presign(self, key: str, expires_in: int = 3600) -> str:
        """
        Generate a time-limited presigned GET URL for a private object.

        Default expiry: 1 hour. Use for academic resources, certificates.
        """
        import asyncio

        loop = asyncio.get_event_loop()
        try:
            url: str = await loop.run_in_executor(
                None,
                lambda: self._client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": settings.storage_bucket_name, "Key": key},
                    ExpiresIn=expires_in,
                ),
            )
            return url
        except ClientError as exc:
            logger.error("storage_presign_failed", key=key, error=str(exc))
            raise

    # ── CDN URL (public files) ────────────────────────────────────────────────

    def cdn_url(self, key: str) -> str:
        """
        Build a CDN URL for publicly accessible objects (banner images, etc.).
        No expiry — served directly from the CDN.
        """
        base = settings.storage_public_url.rstrip("/")
        return f"{base}/{key}"

    # ── Delete ────────────────────────────────────────────────────────────────

    async def delete(self, key: str) -> None:
        import asyncio

        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                lambda: self._client.delete_object(Bucket=settings.storage_bucket_name, Key=key),
            )
            logger.info("storage_delete_ok", key=key)
        except ClientError as exc:
            logger.error("storage_delete_failed", key=key, error=str(exc))
            raise

    # ── Existence check ───────────────────────────────────────────────────────

    async def exists(self, key: str) -> bool:
        import asyncio

        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                lambda: self._client.head_object(Bucket=settings.storage_bucket_name, Key=key),
            )
            return True
        except ClientError:
            return False


# Module-level singleton — imported by services
storage = StorageService()
