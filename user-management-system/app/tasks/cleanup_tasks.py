"""Cleanup tasks for Celery."""

import logging
from datetime import datetime, timedelta, timezone

from celery import shared_task
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models.session import Session
from app.models.notification import Notification
from app.models.user import User
from app.models.audit import AuditLog
from app.models.enums import UserStatus

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async function in sync context for Celery."""
    import asyncio
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@shared_task(name="app.tasks.cleanup_tasks.cleanup_expired_sessions")
def cleanup_expired_sessions() -> int:
    """
    Clean up expired sessions from database.
    
    Returns:
        Number of sessions deleted
    """
    async def _cleanup():
        async with async_session_factory() as session:
            now = datetime.now(timezone.utc)
            
            # Delete expired or revoked sessions
            result = await session.execute(
                delete(Session).where(
                    (Session.expires_at < now) | (Session.revoked == True)
                )
            )
            await session.commit()
            
            count = result.rowcount
            logger.info(f"Cleaned up {count} expired sessions")
            return count
    
    return run_async(_cleanup())


@shared_task(name="app.tasks.cleanup_tasks.cleanup_old_audit_logs")
def cleanup_old_audit_logs(days: int = 90) -> int:
    """
    Archive/delete old audit logs.
    
    Args:
        days: Number of days to retain logs
        
    Returns:
        Number of logs archived/deleted
    """
    async def _cleanup():
        async with async_session_factory() as session:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            # Delete old audit logs
            result = await session.execute(
                delete(AuditLog).where(AuditLog.created_at < cutoff_date)
            )
            await session.commit()
            
            count = result.rowcount
            logger.info(f"Cleaned up {count} old audit logs (older than {days} days)")
            return count
    
    return run_async(_cleanup())


@shared_task(name="app.tasks.cleanup_tasks.cleanup_unverified_users")
def cleanup_unverified_users(days: int = 7) -> int:
    """
    Delete users who haven't verified email within N days.
    
    Args:
        days: Days to wait before deletion
        
    Returns:
        Number of users deleted
    """
    async def _cleanup():
        async with async_session_factory() as session:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            # Soft delete unverified users older than cutoff
            result = await session.execute(
                select(User).where(
                    User.status == UserStatus.PENDING_VERIFICATION,
                    User.email_verified == False,
                    User.created_at < cutoff_date,
                    User.deleted_at.is_(None),
                )
            )
            users = result.scalars().all()
            
            for user in users:
                user.soft_delete()
            
            await session.commit()
            
            count = len(users)
            logger.info(f"Soft deleted {count} unverified users (older than {days} days)")
            return count
    
    return run_async(_cleanup())


@shared_task(name="app.tasks.cleanup_tasks.cleanup_old_notifications")
def cleanup_old_notifications(days: int = 30) -> int:
    """
    Delete old read notifications.
    
    Args:
        days: Days to retain read notifications
        
    Returns:
        Number of notifications deleted
    """
    async def _cleanup():
        async with async_session_factory() as session:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            # Delete old read notifications
            result = await session.execute(
                delete(Notification).where(
                    Notification.read == True,
                    Notification.created_at < cutoff_date,
                )
            )
            await session.commit()
            
            count = result.rowcount
            logger.info(f"Cleaned up {count} old read notifications (older than {days} days)")
            return count
    
    return run_async(_cleanup())
