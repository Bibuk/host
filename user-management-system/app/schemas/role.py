"""Role and Permission Pydantic schemas."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseSchema, IDSchema, TimestampSchema
from app.models.enums import PermissionAction, PermissionScope


class PermissionBase(BaseSchema):
    """Base permission schema."""
    
    resource: str = Field(..., min_length=1, max_length=100)
    action: PermissionAction
    scope: PermissionScope = PermissionScope.GLOBAL
    description: Optional[str] = Field(None, max_length=255)


class PermissionCreate(PermissionBase):
    """Schema for creating a permission."""
    pass


class PermissionUpdate(BaseSchema):
    """Schema for updating a permission."""
    
    description: Optional[str] = Field(None, max_length=255)


class PermissionResponse(IDSchema):
    """Permission response schema."""
    
    resource: str
    action: PermissionAction
    scope: PermissionScope
    description: Optional[str]
    created_at: datetime


class RoleBase(BaseSchema):
    """Base role schema."""
    
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    priority: int = Field(default=0, ge=0)


class RoleCreate(RoleBase):
    """Schema for creating a role."""
    
    parent_role_id: Optional[UUID] = None
    permission_ids: List[UUID] = []


class RoleUpdate(BaseSchema):
    """Schema for updating a role."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    priority: Optional[int] = Field(None, ge=0)
    parent_role_id: Optional[UUID] = None


class RoleResponseBrief(IDSchema):
    """Brief role response."""
    
    name: str
    description: Optional[str]
    priority: int


class RoleResponse(IDSchema, TimestampSchema):
    """Role response schema."""
    
    name: str
    description: Optional[str]
    priority: int
    is_system: bool
    parent_role_id: Optional[UUID]


class RoleWithPermissions(RoleResponse):
    """Role response with permissions."""
    
    permissions: List[PermissionResponse] = []


class AssignRoleRequest(BaseSchema):
    """Request to assign role to user."""
    
    user_id: UUID
    role_id: UUID
    expires_at: Optional[datetime] = None


class RemoveRoleRequest(BaseSchema):
    """Request to remove role from user."""
    
    user_id: UUID
    role_id: UUID


class AddPermissionToRoleRequest(BaseSchema):
    """Request to add permission to role."""
    
    permission_id: UUID


class RemovePermissionFromRoleRequest(BaseSchema):
    """Request to remove permission from role."""
    
    permission_id: UUID
