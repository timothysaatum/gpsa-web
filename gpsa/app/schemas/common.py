from pydantic import BaseModel, ConfigDict

class AppModel(BaseModel):
    """
    Base for all project schemas.

    - orm_mode enabled globally (from_attributes)
    - populate_by_name allows using both field name and alias
    - Serialises UUIDs and datetimes to strings automatically
    """

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        ser_json_timedelta="float",
    )


class PaginatedResponse[DataT](AppModel):
    """Standard envelope for paginated list endpoints."""

    items: list[DataT]
    total: int
    offset: int
    limit: int

    @property
    def has_more(self) -> bool:
        return self.offset + self.limit < self.total


class MessageResponse(AppModel):
    """Simple acknowledgement response."""
    message: str


class ErrorDetail(AppModel):
    field: str
    message: str
    type: str


class ErrorResponse(AppModel):
    detail: str
    errors: list[ErrorDetail] | None = None
    request_id: str | None = None
