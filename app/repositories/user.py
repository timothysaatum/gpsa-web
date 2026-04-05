import uuid
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mixins import SoftDeleteMixin
from app.models.token import PasswordResetToken, RefreshToken
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(User, db)

    # ── Lookups ───────────────────────────────────────────────────────────────

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            self._base_query().where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    async def get_by_student_id(self, student_id: str) -> User | None:
        result = await self.db.execute(
            self._base_query().where(User.student_id == student_id)
        )
        return result.scalar_one_or_none()

    async def get_by_verification_token(self, token_hash: str) -> User | None:
        result = await self.db.execute(
            self._base_query().where(User.verification_token == token_hash)
        )
        return result.scalar_one_or_none()

    # ── Auth state mutations ───────────────────────────────────────────────────

    async def mark_email_verified(self, user: User) -> User:
        user.email_verified = True
        user.verification_token = None
        user.verification_sent_at = None
        await self.db.flush()
        return user

    async def record_login(self, user: User) -> User:
        user.last_login_at = datetime.now(UTC)
        user.failed_login_attempts = 0
        user.locked_until = None
        await self.db.flush()
        return user

    async def record_failed_login(self, user: User) -> User:
        user.failed_login_attempts += 1
        await self.db.flush()
        return user

    async def lock_account(self, user: User, until: datetime) -> User:
        user.locked_until = until
        await self.db.flush()
        return user

    async def update_password(self, user: User, password_hash: str) -> User:
        user.password_hash = password_hash
        await self.db.flush()
        return user


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(RefreshToken, db)

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def revoke(self, token: RefreshToken) -> RefreshToken:
        token.revoked_at = datetime.now(UTC)
        await self.db.flush()
        return token

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> int:
        """Revoke every active refresh token for a user (logout-all-devices)."""
        result = await self.db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(UTC))
        )
        await self.db.flush()
        return result.rowcount


class PasswordResetTokenRepository(BaseRepository[PasswordResetToken]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(PasswordResetToken, db)

    async def get_valid_by_hash(self, token_hash: str) -> PasswordResetToken | None:
        """Return an unused, unexpired token."""
        now = datetime.now(UTC)
        result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.used_at.is_(None),
                PasswordResetToken.expires_at > now,
            )
        )
        return result.scalar_one_or_none()

    async def mark_used(self, token: PasswordResetToken) -> PasswordResetToken:
        token.used_at = datetime.now(UTC)
        await self.db.flush()
        return token

    async def invalidate_existing_for_user(self, user_id: uuid.UUID) -> None:
        """Invalidate any prior reset tokens before issuing a new one."""
        await self.db.execute(
            update(PasswordResetToken)
            .where(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.used_at.is_(None),
            )
            .values(used_at=datetime.now(UTC))
        )
        await self.db.flush()
