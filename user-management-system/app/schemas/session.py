"""Session Pydantic schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from app.schemas.base import BaseSchema, IDSchema
from app.models.enums import DeviceType


class SessionResponse(IDSchema):
    """Session response schema."""
    
    user_id: UUID
    device_type: DeviceType
    device_name: Optional[str]
    device_id: Optional[str]
    os: Optional[str]
    browser: Optional[str]
    ip_address: Optional[str]
    location_city: Optional[str]
    location_country: Optional[str]
    last_activity: datetime
    created_at: datetime
    expires_at: datetime
    is_current: bool = False
    
    @property
    def location(self) -> Optional[str]:
        """Get formatted location."""
        parts = [self.location_city, self.location_country]
        filtered = [p for p in parts if p]
        return ", ".join(filtered) if filtered else None


class SessionListResponse(BaseSchema):
    """List of sessions response."""
    
    sessions: list[SessionResponse]
    total: int


class RevokeSessionRequest(BaseSchema):
    """Request to revoke a session."""
    
    session_id: UUID


class RevokeAllSessionsRequest(BaseSchema):
    """Request to revoke all sessions."""
    
    except_current: bool = True
