"""Notification API endpoints."""

from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_, delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.core.exceptions import NotFoundError, ForbiddenError
from app.models.user import User
from app.models.notification import Notification
from app.models.enums import NotificationType, NotificationPriority, UserStatus
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
)
from app.schemas.base import MessageResponse, PaginatedResponse


router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ==================== Schema definitions ====================

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


class UserNotificationStatsResponse(BaseModel):
    """Response for user notification statistics."""
    
    total: int
    unread: int
    by_type: dict


class AdminNotificationStatsResponse(BaseModel):
    """Response for admin notification statistics."""
    
    total: int
    by_type: dict
    by_priority: dict
    unread_count: int


class UnreadCountResponse(BaseModel):
    """Response for unread count."""
    
    count: int


# ==================== User endpoints (for regular users) ====================

@router.get(
    "",
    response_model=PaginatedResponse[NotificationResponse],
    summary="List my notifications",
)
async def list_my_notifications(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    type: Optional[NotificationType] = Query(None, description="Filter by type"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List current user's notifications with filters.
    """
    # Build query for current user only
    query = select(Notification).where(Notification.user_id == current_user.id)
    count_query = select(func.count(Notification.id)).where(Notification.user_id == current_user.id)
    
    if is_read is not None:
        query = query.where(Notification.read == is_read)
        count_query = count_query.where(Notification.read == is_read)
    if type:
        query = query.where(Notification.type == type)
        count_query = count_query.where(Notification.type == type)
    
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
    response_model=UserNotificationStatsResponse,
    summary="Get my notification statistics",
)
async def get_my_notification_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's notification statistics.
    """
    # Total notifications for current user
    total_result = await db.execute(
        select(func.count(Notification.id)).where(Notification.user_id == current_user.id)
    )
    total = total_result.scalar() or 0
    
    # Unread count for current user
    unread_result = await db.execute(
        select(func.count(Notification.id)).where(
            and_(
                Notification.user_id == current_user.id,
                Notification.read == False
            )
        )
    )
    unread = unread_result.scalar() or 0
    
    # By type for current user
    by_type = {}
    for ntype in NotificationType:
        type_result = await db.execute(
            select(func.count(Notification.id)).where(
                and_(
                    Notification.user_id == current_user.id,
                    Notification.type == ntype
                )
            )
        )
        by_type[ntype.value] = type_result.scalar() or 0
    
    return UserNotificationStatsResponse(
        total=total,
        unread=unread,
        by_type=by_type,
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Get unread notification count",
)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get count of unread notifications for current user.
    """
    result = await db.execute(
        select(func.count(Notification.id)).where(
            and_(
                Notification.user_id == current_user.id,
                Notification.read == False
            )
        )
    )
    count = result.scalar() or 0
    
    return UnreadCountResponse(count=count)


@router.get(
    "/{notification_id}",
    response_model=NotificationResponse,
    summary="Get notification by ID",
)
async def get_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific notification. User can only access their own notifications.
    """
    query = select(Notification).where(Notification.id == notification_id)
    result = await db.execute(query)
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise NotFoundError("Notification", str(notification_id))
    
    # Check ownership
    if notification.user_id != current_user.id:
        raise ForbiddenError("You can only access your own notifications")
    
    return NotificationResponse.model_validate(notification)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark notification as read",
)
async def mark_notification_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a notification as read.
    """
    query = select(Notification).where(Notification.id == notification_id)
    result = await db.execute(query)
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise NotFoundError("Notification", str(notification_id))
    
    # Check ownership
    if notification.user_id != current_user.id:
        raise ForbiddenError("You can only mark your own notifications as read")
    
    notification.read = True
    notification.read_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(notification)
    
    return NotificationResponse.model_validate(notification)


@router.post(
    "/mark-all-read",
    response_model=MessageResponse,
    summary="Mark all notifications as read",
)
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark all current user's notifications as read.
    """
    stmt = (
        update(Notification)
        .where(
            and_(
                Notification.user_id == current_user.id,
                Notification.read == False
            )
        )
        .values(read=True, read_at=datetime.now(timezone.utc))
    )
    result = await db.execute(stmt)
    await db.commit()
    
    return MessageResponse(message=f"Marked {result.rowcount} notifications as read")


@router.delete(
    "/read",
    response_model=MessageResponse,
    summary="Delete all read notifications",
)
async def delete_all_read_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete all read notifications for current user.
    """
    stmt = delete(Notification).where(
        and_(
            Notification.user_id == current_user.id,
            Notification.read == True
        )
    )
    result = await db.execute(stmt)
    await db.commit()
    
    return MessageResponse(message=f"Deleted {result.rowcount} notifications")


@router.delete(
    "/{notification_id}",
    response_model=MessageResponse,
    summary="Delete notification",
)
async def delete_my_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a notification. User can only delete their own notifications.
    """
    query = select(Notification).where(Notification.id == notification_id)
    result = await db.execute(query)
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise NotFoundError("Notification", str(notification_id))
    
    # Check ownership
    if notification.user_id != current_user.id:
        raise ForbiddenError("You can only delete your own notifications")
    
    await db.delete(notification)
    await db.commit()
    
    return MessageResponse(message="Notification deleted successfully")


# ==================== Admin endpoints ====================

@router.post(
    "/admin/send",
    response_model=SendNotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send notification to users (Admin)",
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
    "/admin/broadcast",
    response_model=SendNotificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Broadcast notification to all users (Admin)",
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
    "/admin/list",
    response_model=PaginatedResponse[NotificationResponse],
    summary="List all notifications (Admin)",
)
async def list_all_notifications(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    user_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    type: Optional[NotificationType] = Query(None, description="Filter by type"),
    priority: Optional[NotificationPriority] = Query(None, description="Filter by priority"),
    current_user: User = Depends(require_permission("notifications", "read")),
    db: AsyncSession = Depends(get_db),
):
    """
    List all notifications with filters (Admin).
    
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
    "/admin/stats",
    response_model=AdminNotificationStatsResponse,
    summary="Get notification statistics (Admin)",
)
async def get_admin_notification_stats(
    current_user: User = Depends(require_permission("notifications", "read")),
    db: AsyncSession = Depends(get_db),
):
    """
    Get global notification statistics (Admin).
    
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
    
    return AdminNotificationStatsResponse(
        total=total,
        by_type=by_type,
        by_priority=by_priority,
        unread_count=unread_count,
    )


@router.delete(
    "/admin/{notification_id}",
    response_model=MessageResponse,
    summary="Delete any notification (Admin)",
)
async def admin_delete_notification(
    notification_id: UUID,
    current_user: User = Depends(require_permission("notifications", "delete")),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete any notification (Admin).
    
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
    "/admin/bulk",
    response_model=MessageResponse,
    summary="Delete multiple notifications (Admin)",
)
async def admin_delete_notifications(
    notification_ids: List[UUID] = Query(..., description="List of notification IDs to delete"),
    current_user: User = Depends(require_permission("notifications", "delete")),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete multiple notifications (Admin).
    
    Requires `notifications:delete` permission.
    """
    stmt = delete(Notification).where(Notification.id.in_(notification_ids))
    result = await db.execute(stmt)
    await db.commit()
    
    return MessageResponse(message=f"Deleted {result.rowcount} notifications")
