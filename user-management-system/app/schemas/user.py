"""User Pydantic schemas."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.base import BaseSchema, IDSchema, TimestampSchema, validate_password_strength
from app.models.enums import UserStatus


class UserBase(BaseSchema):
    """Base user schema."""
    
    email: EmailStr
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    locale: str = Field(default="en", max_length=10)
    timezone: str = Field(default="UTC", max_length=50)


class UserCreate(UserBase):
    """Schema for creating a user."""
    
    password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        return validate_password_strength(v)
    
    @field_validator("username")
    @classmethod
    def validate_username(cls, v: Optional[str]) -> Optional[str]:
        """Validate username format."""
        if v is None:
            return v
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")
        return v.lower()


class UserUpdate(BaseSchema):
    """Schema for updating a user."""
    
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = Field(None, max_length=500)
    locale: Optional[str] = Field(None, max_length=10)
    timezone: Optional[str] = Field(None, max_length=50)


class UserUpdateAdmin(UserUpdate):
    """Schema for admin updating a user."""
    
    status: Optional[UserStatus] = None
    email_verified: Optional[bool] = None


class PasswordChange(BaseSchema):
    """Schema for changing password."""
    
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        return validate_password_strength(v)


class PasswordReset(BaseSchema):
    """Schema for password reset request."""
    
    email: EmailStr


class PasswordResetConfirm(BaseSchema):
    """Schema for confirming password reset."""
    
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class UserResponse(IDSchema, TimestampSchema):
    """Schema for user response."""
    
    email: EmailStr
    username: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    avatar_url: Optional[str]
    status: UserStatus
    email_verified: bool
    locale: str
    timezone: str
    last_login_at: Optional[datetime]
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        parts = [self.first_name, self.last_name]
        return " ".join(filter(None, parts)) or str(self.email)


class UserResponseBrief(IDSchema):
    """Brief user response for lists."""
    
    email: EmailStr
    username: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    status: UserStatus


class UserWithRoles(UserResponse):
    """User response with roles."""
    
    roles: List["RoleResponseBrief"] = []


# Forward reference
from app.schemas.role import RoleResponseBrief
UserWithRoles.model_rebuild()
