"""Audit log Pydantic schemas."""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseSchema, IDSchema
from app.models.enums import AuditStatus


class AuditLogCreate(BaseSchema):
    """Schema for creating an audit log entry."""
    
    event_type: str = Field(..., min_length=1, max_length=100)
    actor_user_id: Optional[UUID] = None
    actor_session_id: Optional[UUID] = None
    target_resource_type: Optional[str] = Field(None, max_length=50)
    target_resource_id: Optional[UUID] = None
    action: str = Field(..., min_length=1, max_length=50)
    status: AuditStatus = AuditStatus.SUCCESS
    ip_address: Optional[str] = None
    device_info: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}


class AuditLogResponse(IDSchema):
    """Audit log response schema."""
    
    event_type: str
    actor_user_id: Optional[UUID]
    actor_session_id: Optional[UUID]
    target_resource_type: Optional[str]
    target_resource_id: Optional[UUID]
    action: str
    status: AuditStatus
    ip_address: Optional[str]
    device_info: Dict[str, Any]
    metadata: Dict[str, Any]
    created_at: datetime


class AuditLogFilter(BaseSchema):
    """Filter for audit logs."""
    
    event_type: Optional[str] = None
    actor_user_id: Optional[UUID] = None
    target_resource_type: Optional[str] = None
    target_resource_id: Optional[UUID] = None
    action: Optional[str] = None
    status: Optional[AuditStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AuditLogListResponse(BaseSchema):
    """List of audit logs response."""
    
    logs: list[AuditLogResponse]
    total: int
    page: int
    page_size: int
