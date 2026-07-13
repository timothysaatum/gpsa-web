import uuid
from datetime import datetime

from pydantic import Field

from app.models.enums import ContentType, FileType, Trimester
from app.schemas.common import AppModel


class CourseResponse(AppModel):
    id: uuid.UUID
    name: str
    code: str | None
    level: int


class CourseCreateRequest(AppModel):
    name: str = Field(min_length=2, max_length=255)
    code: str | None = Field(default=None, max_length=20)
    level: int = Field(ge=100, le=600)


class AcademicResourceResponse(AppModel):
    id: uuid.UUID
    title: str
    content_type: ContentType
    course_id: uuid.UUID
    course: CourseResponse | None = None
    level: int
    trimester: Trimester
    file_type: FileType
    mime_type: str
    file_size_bytes: int
    duration_mins: int | None
    is_featured: bool
    is_published: bool
    # download_url resolved at the API layer from file_key — never stored
    download_url: str | None = None
    created_at: datetime


class AcademicResourceCreateRequest(AppModel):
    title: str = Field(min_length=3, max_length=500)
    content_type: ContentType
    course_id: uuid.UUID
    level: int = Field(ge=100, le=600)
    trimester: Trimester
    duration_mins: int | None = Field(default=None, ge=1)  # videos only
    is_featured: bool = False


class AcademicResourceUpdateRequest(AppModel):
    title: str | None = Field(default=None, max_length=500)
    content_type: ContentType | None = None
    course_id: uuid.UUID | None = None
    level: int | None = Field(default=None, ge=100, le=600)
    trimester: Trimester | None = None
    duration_mins: int | None = None
    is_featured: bool | None = None
    is_published: bool | None = None
