"""Notification Pydantic schemas."""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseSchema, IDSchema
from app.models.enums import NotificationType, NotificationPriority


class NotificationCreate(BaseSchema):
    """Schema for creating a notification."""
    
    user_id: UUID
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    type: NotificationType = NotificationType.PERSONAL
    priority: NotificationPriority = NotificationPriority.NORMAL
    action_url: Optional[str] = Field(None, max_length=500)
    metadata: Dict[str, Any] = {}


class NotificationResponse(IDSchema):
    """Notification response schema."""
    
    user_id: UUID
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority
    read: bool
    read_at: Optional[datetime]
    action_url: Optional[str]
    created_at: datetime


class NotificationListResponse(BaseSchema):
    """List of notifications response."""
    
    notifications: list[NotificationResponse]
    total: int
    unread_count: int


class MarkNotificationReadRequest(BaseSchema):
    """Request to mark notification as read."""
    
    notification_ids: list[UUID]


class MarkAllNotificationsReadResponse(BaseSchema):
    """Response for marking all notifications as read."""
    
    marked_count: int
