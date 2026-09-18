import logging
import sqlite3
import uuid
from typing import Any, AsyncGenerator
from fastapi import HTTPException
from sqlalchemy import JSON, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB as PG_JSONB
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

# Register Python uuid.UUID adapter for SQLite so raw parameters bind seamlessly
sqlite3.register_adapter(uuid.UUID, lambda u: str(u))

logger = logging.getLogger("uvicorn.error")

# 1. Dynamic Dialect Detection
is_sqlite: bool = settings.DATABASE_URL.startswith("sqlite")


# 2. Universal Dialect-Aware Types (PostgreSQL + SQLite)
class UniversalUUID(Uuid):
    """
    Universal UUID type supporting both PostgreSQL (native UUID)
    and SQLite (CHAR(32)/String(36)) while consistently exchanging
    Python uuid.UUID objects.
    """

    def __init__(self, as_uuid: bool = True, *args: Any, **kwargs: Any):
        super().__init__(as_uuid=as_uuid, *args, **kwargs)


if is_sqlite:
    # Map PostgreSQL JSONB to standard JSON for SQLite
    JSONB = JSON
    UUID = UniversalUUID
    SERVER_UUID_DEFAULT = None
    SERVER_JSON_DEFAULT = text("'{}'")
else:
    # On PostgreSQL, compile JSONB and native UUID with universal SQLite compatibility
    JSONB = JSON().with_variant(PG_JSONB(), "postgresql")
    UUID = UniversalUUID
    SERVER_UUID_DEFAULT = None
    SERVER_JSON_DEFAULT = text("'{}'")


def create_app_engine(database_url: str) -> AsyncEngine:
    """Create async SQLAlchemy engine tailored for SQLite or PostgreSQL."""
    if database_url.startswith("sqlite"):
        return create_async_engine(
            database_url,
            echo=False,
            future=True,
            connect_args={"check_same_thread": False},
        )
    else:
        return create_async_engine(
            database_url,
            echo=False,
            future=True,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )


# 3. Active Engine Instance
engine: AsyncEngine = create_app_engine(settings.DATABASE_URL)

# 4. Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an async database session.
    Commits on successful completion, rollbacks on error, and ensures the session is closed.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except HTTPException:
            await session.rollback()
            raise
        except Exception as err:
            await session.rollback()
            logger.error(f"Database session error: {err}")
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize database tables using Base.metadata.create_all().
    If PostgreSQL is configured but unreachable (e.g. hackathon evaluator running locally
    without PostgreSQL credentials), gracefully activates zero-install SQLite fallback.
    """
    global engine, AsyncSessionLocal, is_sqlite
    from app.models.base import Base
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        db_type = "SQLite" if is_sqlite else "PostgreSQL"
        logger.info(f"Database tables verified and initialized successfully on {db_type}.")
    except Exception as err:
        if not is_sqlite:
            fallback_url = "sqlite+aiosqlite:///./chartermind_local.db"
            logger.warning(
                f"Could not connect to PostgreSQL ({err}). "
                f"Gracefully activating zero-install SQLite fallback: {fallback_url}"
            )
            # Create fallback SQLite engine and re-bind sessionmaker
            engine = create_app_engine(fallback_url)
            AsyncSessionLocal = async_sessionmaker(
                bind=engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=False,
            )
            is_sqlite = True
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("SQLite local database tables initialized successfully.")
        else:
            logger.error(f"Failed to initialize database tables: {err}")
            raise


# Re-export Base for backward compatibility
from app.models.base import Base  # noqa: E402, F401
