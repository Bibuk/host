"""Notification tasks for Celery."""

import logging
from datetime import datetime, timezone

from celery import shared_task
from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.notification import Notification
from app.models.user import User
from app.models.enums import UserStatus, NotificationType, NotificationPriority

logger = logging.getLogger(__name__)


def run_async(coro):
    """Run async function in sync context for Celery."""
    import asyncio
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@shared_task(name="app.tasks.notification_tasks.send_push_notification")
def send_push_notification(
    user_id: str,
    title: str,
    body: str,
    data: dict = None,
) -> bool:
    """
    Send push notification to user's devices.
    
    Args:
        user_id: User ID
        title: Notification title
        body: Notification body
        data: Additional data
        
    Returns:
        True if sent successfully
    """
    # TODO: Implement push notification via Firebase/APNs
    # For now, just create an in-app notification
    async def _send():
        async with async_session_factory() as session:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=body,
                type=NotificationType.PERSONAL,
                priority=NotificationPriority.NORMAL,
                metadata_=data or {},
            )
            session.add(notification)
            await session.commit()
            logger.info(f"Created notification for user {user_id}: {title}")
            return True
    
    try:
        return run_async(_send())
    except Exception as e:
        logger.error(f"Failed to send notification to user {user_id}: {e}")
        return False


@shared_task(name="app.tasks.notification_tasks.send_pending_notifications")
def send_pending_notifications() -> int:
    """
    Process and send pending notifications.
    
    Returns:
        Number of notifications processed
    """
    # This would typically check for notifications that need to be
    # sent via external services (email, push, etc.)
    logger.info("Processing pending notifications")
    return 0


@shared_task(name="app.tasks.notification_tasks.broadcast_notification")
def broadcast_notification(
    title: str,
    message: str,
    notification_type: str = "broadcast",
) -> int:
    """
    Broadcast notification to all active users.
    
    Args:
        title: Notification title
        message: Notification message
        notification_type: Type of notification
        
    Returns:
        Number of users notified
    """
    async def _broadcast():
        async with async_session_factory() as session:
            # Get all active users
            result = await session.execute(
                select(User.id).where(
                    User.status == UserStatus.ACTIVE,
                    User.deleted_at.is_(None),
                )
            )
            user_ids = result.scalars().all()
            
            # Create notifications for all users
            notifications = []
            for user_id in user_ids:
                notification = Notification(
                    user_id=user_id,
                    title=title,
                    message=message,
                    type=NotificationType.BROADCAST,
                    priority=NotificationPriority.NORMAL,
                )
                notifications.append(notification)
            
            session.add_all(notifications)
            await session.commit()
            
            count = len(notifications)
            logger.info(f"Broadcast notification sent to {count} users: {title}")
            return count
    
    try:
        return run_async(_broadcast())
    except Exception as e:
        logger.error(f"Failed to broadcast notification: {e}")
        return 0


@shared_task(name="app.tasks.notification_tasks.create_security_notification")
def create_security_notification(
    user_id: str,
    title: str,
    message: str,
    metadata: dict = None,
) -> bool:
    """
    Create a security-related notification for a user.
    
    Args:
        user_id: User ID
        title: Notification title
        message: Notification message
        metadata: Additional metadata
        
    Returns:
        True if created successfully
    """
    async def _create():
        async with async_session_factory() as session:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=NotificationType.SECURITY,
                priority=NotificationPriority.HIGH,
                metadata_=metadata or {},
            )
            session.add(notification)
            await session.commit()
            logger.info(f"Created security notification for user {user_id}: {title}")
            return True
    
    try:
        return run_async(_create())
    except Exception as e:
        logger.error(f"Failed to create security notification for user {user_id}: {e}")
        return False
