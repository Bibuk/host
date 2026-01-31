"""Authentication Pydantic schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import EmailStr, Field, field_validator

from app.schemas.base import BaseSchema, validate_password_strength
from app.schemas.user import UserResponse


class LoginRequest(BaseSchema):
    """Login request schema."""
    
    email: EmailStr
    password: str = Field(..., min_length=1)
    device_id: Optional[str] = Field(None, max_length=100)
    device_name: Optional[str] = Field(None, max_length=100)


class RegisterRequest(BaseSchema):
    
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_strength(v)


class TokenResponse(BaseSchema):
    """Token response schema."""
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    expires_at: datetime


class TokenRefreshRequest(BaseSchema):
    """Token refresh request schema."""
    
    refresh_token: str


class TokenRefreshResponse(BaseSchema):
    """Token refresh response schema."""
    
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    expires_at: datetime


class LoginResponse(BaseSchema):
    """Login response with user and tokens."""
    
    user: UserResponse
    tokens: TokenResponse


class VerifyEmailRequest(BaseSchema):
    """Email verification request."""
    
    token: str


class ResendVerificationRequest(BaseSchema):
    """Resend verification email request."""
    
    email: EmailStr


class ForgotPasswordRequest(BaseSchema):
    """Forgot password request."""
    
    email: EmailStr


class ResetPasswordRequest(BaseSchema):
    """Reset password request."""
    
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


class LogoutRequest(BaseSchema):
    """Logout request schema."""
    
    session_id: Optional[UUID] = None
    all_devices: bool = False


class SessionInfo(BaseSchema):
    """Current session info."""
    
    session_id: UUID
    user_id: UUID
    device_type: str
    device_name: Optional[str]
    ip_address: Optional[str]
    location: Optional[str]
    created_at: datetime
    last_activity: datetime
    is_current: bool = False
