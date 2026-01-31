"""Notification API endpoints for admin."""

from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, func, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.models.notification import Notification
from app.models.enums import NotificationType, NotificationPriority, UserStatus
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
)
from app.schemas.base import MessageResponse, PaginatedResponse


router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ==================== Admin endpoints ====================

class NotificationSendRequest:
    """Request to send notification to users."""
    pass


from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID


class SendNotificationRequest(BaseModel):
    """Request to send notification to specific users."""
    
    user_ids: List[UUID] = Field(..., min_length=1, description="List of user IDs to send notification to")
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    type: NotificationType = NotificationType.PERSONAL
    priority: NotificationPriority = NotificationPriority.NORMAL
    action_url: Optional[str] = Field(None, max_length=500)


class BroadcastNotificationRequest(BaseModel):
    """Request to broadcast notification to all users."""
    
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    priority: NotificationPriority = NotificationPriority.NORMAL
    action_url: Optional[str] = Field(None, max_length=500)
    exclude_user_ids: List[UUID] = Field(default_factory=list, description="User IDs to exclude from broadcast")


class SendNotificationResponse(BaseModel):
    """Response for send notification."""
    
    sent_count: int
    notification_ids: List[UUID]


class NotificationStatsResponse(BaseModel):
    """Response for notification statistics."""
    
    total: int
    by_type: dict
    by_priority: dict
    unread_count: int


@router.post(
    "/send",
    response_model=SendNotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send notification to users",
)
async def send_notification(
    data: SendNotificationRequest,
    current_user: User = Depends(require_permission("notifications", "create")),
    db: AsyncSession = Depends(get_db),
):
    """
    Send notification to specific users.
    
    Requires `notifications:create` permission.
    """
    notification_ids = []
    
    for user_id in data.user_ids:
        # Check if user exists
        user_query = select(User).where(User.id == user_id)
        result = await db.execute(user_query)
        user = result.scalar_one_or_none()
        
        if user:
            notification = Notification(
                user_id=user_id,
                title=data.title,
                message=data.message,
                type=data.type,
                priority=data.priority,
                action_url=data.action_url,
                metadata_={
                    "sent_by": str(current_user.id),
                    "sent_by_email": current_user.email,
                },
            )
            db.add(notification)
            notification_ids.append(notification.id)
    
    await db.commit()
    
    return SendNotificationResponse(
        sent_count=len(notification_ids),
        notification_ids=notification_ids,
    )


@router.post(
    "/broadcast",
    response_model=SendNotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Broadcast notification to all users",
)
async def broadcast_notification(
    data: BroadcastNotificationRequest,
    current_user: User = Depends(require_permission("notifications", "create")),
    db: AsyncSession = Depends(get_db),
):
    """
    Broadcast notification to all active users.
    
    Requires `notifications:create` permission.
    """
    # Get all active users except excluded
    query = select(User).where(
        and_(
            User.status == UserStatus.ACTIVE,
            User.id.notin_(data.exclude_user_ids) if data.exclude_user_ids else True,
        )
    )
    result = await db.execute(query)
    users = result.scalars().all()
    
    notification_ids = []
    
    for user in users:
        notification = Notification(
            user_id=user.id,
            title=data.title,
            message=data.message,
            type=NotificationType.BROADCAST,
            priority=data.priority,
            action_url=data.action_url,
            metadata_={
                "sent_by": str(current_user.id),
                "sent_by_email": current_user.email,
                "is_broadcast": True,
            },
        )
        db.add(notification)
        notification_ids.append(notification.id)
    
    await db.commit()
    
    return SendNotificationResponse(
        sent_count=len(notification_ids),
        notification_ids=notification_ids,
    )


@router.get(
    "",
    response_model=PaginatedResponse[NotificationResponse],
    summary="List all notifications (admin)",
)
async def list_notifications(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    user_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    type: Optional[NotificationType] = Query(None, description="Filter by type"),
    priority: Optional[NotificationPriority] = Query(None, description="Filter by priority"),
    current_user: User = Depends(require_permission("notifications", "read")),
    db: AsyncSession = Depends(get_db),
):
    """
    List all notifications with filters.
    
    Requires `notifications:read` permission.
    """
    # Build query
    query = select(Notification)
    count_query = select(func.count(Notification.id))
    
    if user_id:
        query = query.where(Notification.user_id == user_id)
        count_query = count_query.where(Notification.user_id == user_id)
    if type:
        query = query.where(Notification.type == type)
        count_query = count_query.where(Notification.type == type)
    if priority:
        query = query.where(Notification.priority == priority)
        count_query = count_query.where(Notification.priority == priority)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Get paginated results
    offset = (page - 1) * page_size
    query = query.order_by(Notification.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return PaginatedResponse.create(
        items=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/stats",
    response_model=NotificationStatsResponse,
    summary="Get notification statistics",
)
async def get_notification_stats(
    current_user: User = Depends(require_permission("notifications", "read")),
    db: AsyncSession = Depends(get_db),
):
    """
    Get notification statistics.
    
    Requires `notifications:read` permission.
    """
    # Total notifications
    total_result = await db.execute(select(func.count(Notification.id)))
    total = total_result.scalar() or 0
    
    # Unread count
    unread_result = await db.execute(
        select(func.count(Notification.id)).where(Notification.read == False)
    )
    unread_count = unread_result.scalar() or 0
    
    # By type
    by_type = {}
    for ntype in NotificationType:
        type_result = await db.execute(
            select(func.count(Notification.id)).where(Notification.type == ntype)
        )
        by_type[ntype.value] = type_result.scalar() or 0
    
    # By priority
    by_priority = {}
    for priority in NotificationPriority:
        priority_result = await db.execute(
            select(func.count(Notification.id)).where(Notification.priority == priority)
        )
        by_priority[priority.value] = priority_result.scalar() or 0
    
    return NotificationStatsResponse(
        total=total,
        by_type=by_type,
        by_priority=by_priority,
        unread_count=unread_count,
    )


@router.delete(
    "/{notification_id}",
    response_model=MessageResponse,
    summary="Delete notification",
)
async def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(require_permission("notifications", "delete")),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a notification.
    
    Requires `notifications:delete` permission.
    """
    query = select(Notification).where(Notification.id == notification_id)
    result = await db.execute(query)
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise NotFoundError("Notification", str(notification_id))
    
    await db.delete(notification)
    await db.commit()
    
    return MessageResponse(message="Notification deleted successfully")


@router.delete(
    "",
    response_model=MessageResponse,
    summary="Delete multiple notifications",
)
async def delete_notifications(
    notification_ids: List[UUID] = Query(..., description="List of notification IDs to delete"),
    current_user: User = Depends(require_permission("notifications", "delete")),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete multiple notifications.
    
    Requires `notifications:delete` permission.
    """
    stmt = delete(Notification).where(Notification.id.in_(notification_ids))
    result = await db.execute(stmt)
    await db.commit()
    
    return MessageResponse(message=f"Deleted {result.rowcount} notifications")
