import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

import app.models  # noqa: F401 — registers all ORM models on Base.metadata
from app.core.config import settings

# ── Import Base + all models for autogenerate ─────────────────────────────────
# This must happen before target_metadata is read.
from app.db.base import Base

# ── Alembic config object ─────────────────────────────────────────────────────
config = context.config

# Override the sqlalchemy.url from alembic.ini with the value from Settings
# so there is a single source of truth.
config.set_main_option("sqlalchemy.url", settings.database_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# ── Helpers ───────────────────────────────────────────────────────────────────


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode — emit SQL to stdout/file
    without connecting to the database. Useful for generating
    SQL scripts for review before applying.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Emit explicit COMMIT after each migration step
        transaction_per_migration=True,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        transaction_per_migration=True,
        compare_type=True,  # detect column type changes
        compare_server_default=True,  # detect server_default changes
        include_schemas=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations against a live async engine."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # never pool connections during migrations
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


# ── Entry point ───────────────────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
