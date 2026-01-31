"""Database connection and session management."""

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text, event
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.models.base import Base

logger = logging.getLogger(__name__)


# Create async engine with production-ready settings
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Check connection validity before use
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_timeout=30,  # Wait up to 30 seconds for a connection
    connect_args={
        "server_settings": {
            "application_name": settings.APP_NAME,
        }
    } if "postgresql" in settings.DATABASE_URL else {},
)

# Create session factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database session.
    
    Usage:
        @router.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except SQLAlchemyError as e:
            logger.error(f"Database error, rolling back: {type(e).__name__}")
            await session.rollback()
            raise
        except Exception as e:
            logger.error(f"Unexpected error, rolling back: {type(e).__name__}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")


async def close_db() -> None:
    """Close database engine."""
    await engine.dispose()
    logger.info("Database engine disposed")


async def check_db_connection() -> bool:
    """Check if database connection is alive."""
    try:
        async with async_session_factory() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()  # Fetch the result to ensure query completed
            return True
    except Exception as e:
        logger.error(f"Database health check failed: {type(e).__name__}: {e}")
        return False


async def get_db_pool_status() -> dict:
    """Get database connection pool status."""
    pool = engine.pool
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalid": pool.invalidatedcount() if hasattr(pool, 'invalidatedcount') else 0,
    }
