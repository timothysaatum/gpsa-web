"""
News service — coordinates repositories, permissions, audit, and notifications
for news post lifecycle: create, update, publish, delete, and public queries.
"""

import uuid
from datetime import UTC, datetime

import structlog
from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import assert_permission, can_publish_news, can_write_news
from app.domain.bus import bus as domain_bus
from app.domain.events import NewsPublished
from app.domain.kernel import DomainEventBus
from app.models.enums import NewsCategory
from app.models.news import NewsPost
from app.models.user import User
from app.repositories.base import BaseRepository
from app.services.audit import AuditService

logger = structlog.get_logger(__name__)


class NewsRepository(BaseRepository[NewsPost]):
    def __init__(self, db: AsyncSession) -> None:
        super().__init__(NewsPost, db)

    async def list_published(
        self,
        *,
        category: NewsCategory | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[NewsPost]:

        q = (
            self._base_query()
            .where(NewsPost.published_at.is_not(None))
        )
        if category:
            q = q.where(NewsPost.category == category)
        q = q.order_by(NewsPost.published_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def count_published(
        self,
        *,
        category: NewsCategory | None = None,
    ) -> int:
        from sqlalchemy import func, select

        q = (
            select(func.count())
            .select_from(NewsPost)
            .where(
                NewsPost.deleted_at.is_(None),
                NewsPost.published_at.is_not(None),
            )
        )
        if category:
            q = q.where(NewsPost.category == category)
        result = await self.db.execute(q)
        return result.scalar_one()

    async def get_featured(self) -> NewsPost | None:
        result = await self.db.execute(
            self._base_query()
            .where(NewsPost.is_featured.is_(True), NewsPost.published_at.is_not(None))
            .order_by(NewsPost.published_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_strip_announcements(self) -> list[NewsPost]:
        result = await self.db.execute(
            self._base_query()
            .where(
                NewsPost.is_strip_announcement.is_(True),
                NewsPost.published_at.is_not(None),
            )
            .order_by(NewsPost.published_at.desc())
            .limit(10)
        )
        return list(result.scalars().all())

    async def search(self, q_str: str, offset: int = 0, limit: int = 20) -> list[NewsPost]:
        from sqlalchemy import or_

        result = await self.db.execute(
            self._base_query()
            .where(
                NewsPost.published_at.is_not(None),
                or_(
                    NewsPost.title.ilike(f"%{q_str}%"),
                    NewsPost.summary.ilike(f"%{q_str}%"),
                    NewsPost.body.ilike(f"%{q_str}%"),
                ),
            )
            .order_by(NewsPost.published_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())


class NewsService:
    def __init__(self, db: AsyncSession, bus: DomainEventBus | None = None) -> None:
        self.db = db
        self.repo = NewsRepository(db)
        self.audit = AuditService(db)
        self.bus = bus or domain_bus

    async def list_published(
        self,
        category: NewsCategory | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[NewsPost], int]:
        posts = await self.repo.list_published(category=category, offset=offset, limit=limit)
        total = await self.repo.count_published(category=category)
        return posts, total

    async def get_featured(self) -> NewsPost | None:
        return await self.repo.get_featured()

    async def get_strip_announcements(self) -> list[NewsPost]:
        return await self.repo.get_strip_announcements()

    async def search(
        self, q_str: str, offset: int = 0, limit: int = 20
    ) -> list[NewsPost]:
        if len(q_str.strip()) < 2:
            raise HTTPException(
                status_code=400, detail="Search query must be at least 2 characters."
            )
        return await self.repo.search(q_str.strip(), offset=offset, limit=limit)

    async def get_by_id(self, post_id: uuid.UUID) -> NewsPost:
        post = await self.repo.get_by_id_or_404(post_id)
        if not post.is_published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        return post

    async def create(
        self,
        title: str,
        category: NewsCategory,
        summary: str,
        body: str,
        actor: User,
        request: Request,
        *,
        banner_emoji: str | None = None,
        is_featured: bool = False,
        is_urgent: bool = False,
        is_strip_announcement: bool = False,
        attachments: list[str] | None = None,
        publish_immediately: bool = False,
    ) -> NewsPost:
        assert_permission(can_write_news(actor))
        can_publish = can_publish_news(actor)

        if publish_immediately and not can_publish:
            raise HTTPException(status_code=403, detail="Only admins can publish immediately.")

        published_at = datetime.now(UTC) if (publish_immediately and can_publish) else None

        post = await self.repo.create({
            "title": title,
            "category": category,
            "summary": summary,
            "body": body,
            "banner_emoji": banner_emoji,
            "is_featured": is_featured,
            "is_urgent": is_urgent,
            "is_strip_announcement": is_strip_announcement,
            "attachments": attachments,
            "published_at": published_at,
            "author_id": actor.id,
        })
        await self.audit.log(
            action="CREATE", entity_type="news_post", entity_id=post.id,
            new_values={"title": post.title, "published": post.is_published}, request=request,
        )
        await self.db.commit()
        if post.is_published:
            await self.bus.publish_async(NewsPublished(
                post_id=post.id, title=post.title, category=str(post.category),
            ))
        return post

    async def update(
        self,
        post_id: uuid.UUID,
        updates: dict,
        actor: User,
        request: Request,
    ) -> NewsPost:
        assert_permission(can_write_news(actor))
        post = await self.repo.get_by_id_or_404(post_id)
        old_values = {k: str(getattr(post, k)) for k in updates}
        post = await self.repo.update(post, updates)
        await self.audit.log(
            action="UPDATE", entity_type="news_post", entity_id=post.id,
            old_values=old_values, new_values={k: str(v) for k, v in updates.items()},
            request=request,
        )
        await self.db.commit()
        return post

    async def publish(self, post_id: uuid.UUID, request: Request) -> NewsPost:
        post = await self.repo.get_by_id_or_404(post_id)
        if post.is_published:
            raise HTTPException(status_code=400, detail="Post is already published.")
        post = await self.repo.update(post, {"published_at": datetime.now(UTC)})
        await self.audit.log(
            action="PUBLISH", entity_type="news_post", entity_id=post.id, request=request
        )
        await self.db.commit()
        await self.bus.publish_async(NewsPublished(
            post_id=post.id, title=post.title, category=str(post.category),
        ))
        return post

    async def delete(self, post_id: uuid.UUID, request: Request) -> None:
        post = await self.repo.get_by_id_or_404(post_id)
        await self.repo.soft_delete(post)
        await self.audit.log(
            action="DELETE", entity_type="news_post", entity_id=post.id, request=request
        )
        await self.db.commit()
