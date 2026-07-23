"""
Pagination utilities.

Provides a consistent offset-based pagination pattern used
across all list endpoints.

Usage:
    from app.utils.pagination import PaginationParams, paginate

    @router.get("/")
    async def list_items(params: PaginationParams = Depends()) -> PaginatedResponse[ItemResponse]:
        items = await repo.list(offset=params.offset, limit=params.limit)
        total = await repo.count()
        return paginate(items, total, params)
"""

from typing import TypeVar

from fastapi import Query
from pydantic import BaseModel

from app.schemas.common import PaginatedResponse

T = TypeVar("T")


class PaginationParams(BaseModel):
    """
    Reusable FastAPI dependency for offset-based pagination.

    Usage in route:
        params: Annotated[PaginationParams, Depends()]
    """

    offset: int = Query(default=0, ge=0, description="Number of items to skip")
    limit: int = Query(default=20, ge=1, le=100, description="Maximum items to return")

    model_config = {"arbitrary_types_allowed": True}


def paginate(items: list[T], total: int, params: PaginationParams) -> PaginatedResponse[T]:
    """Wrap a list of items into the standard paginated envelope."""
    return PaginatedResponse(
        items=items,
        total=total,
        offset=params.offset,
        limit=params.limit,
    )
