from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Single declarative base for all ORM models.
    Alembic's env.py imports this to discover all table metadata.
    """

    pass
