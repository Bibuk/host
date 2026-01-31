"""FastAPI dependencies for authentication and authorization."""

from typing import Optional
import uuid

from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import decode_token, hash_token
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    TokenExpiredError,
    TokenInvalidError,
    UserInactiveError,
    SessionRevokedError,
)
from app.models.user import User
from app.models.session import Session
from app.models.enums import UserStatus


# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Get current user from JWT token (optional).
    
    Returns None if no token or invalid token.
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        return None
    
    # Check token type
    if payload.get("type") != "access":
        return None
    
    # Get user ID from token
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        return None
    
    # Get user from database
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles))
        .where(User.id == user_uuid)
        .where(User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        return None
    
    if user.status != UserStatus.ACTIVE:
        return None
    
    return user


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Get current user from JWT token (required).
    
    Raises AuthenticationError if not authenticated.
    """
    if not credentials:
        raise AuthenticationError("Missing authentication token")
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise TokenInvalidError()
    
    # Check token type
    if payload.get("type") != "access":
        raise TokenInvalidError()
    
    # Get user ID from token
    user_id = payload.get("sub")
    if not user_id:
        raise TokenInvalidError()
    
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise TokenInvalidError()
    
    # Verify session is still valid
    session_id = payload.get("session_id")
    if session_id:
        try:
            session_uuid = uuid.UUID(session_id)
            result = await db.execute(
                select(Session)
                .where(Session.id == session_uuid)
                .where(Session.revoked == False)
            )
            session = result.scalar_one_or_none()
            
            if not session or not session.is_active:
                raise SessionRevokedError()
        except ValueError:
            pass
    
    # Get user from database
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles))
        .where(User.id == user_uuid)
        .where(User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise AuthenticationError("User not found")
    
    if user.status == UserStatus.LOCKED:
        raise AuthenticationError("User account is locked")
    
    if user.status == UserStatus.SUSPENDED:
        raise AuthenticationError("User account is suspended")
    
    if user.status != UserStatus.ACTIVE:
        raise UserInactiveError()
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise UserInactiveError()
    return current_user


class PermissionChecker:
    """Dependency for checking user permissions."""
    
    def __init__(self, resource: str, action: str):
        self.resource = resource
        self.action = action
    
    async def __call__(
        self,
        current_user: User = Depends(get_current_user),
    ) -> User:
        """Check if user has required permission."""
        # Check if user has the permission through any of their roles
        for role in current_user.roles:
            for permission in role.permissions:
                if permission.resource == self.resource and permission.action.value == self.action:
                    return current_user
        
        raise AuthorizationError(
            f"Permission denied: {self.action} on {self.resource}"
        )


def require_permission(resource: str, action: str) -> PermissionChecker:
    """Create a permission checker dependency."""
    return PermissionChecker(resource, action)


class RoleChecker:
    """Dependency for checking user roles."""
    
    def __init__(self, *required_roles: str):
        self.required_roles = required_roles
    
    async def __call__(
        self,
        current_user: User = Depends(get_current_user),
    ) -> User:
        """Check if user has any of the required roles."""
        user_role_names = {role.name for role in current_user.roles}
        
        if not any(role in user_role_names for role in self.required_roles):
            raise AuthorizationError(
                f"Required role: {' or '.join(self.required_roles)}"
            )
        
        return current_user


def require_role(*roles: str) -> RoleChecker:
    """Create a role checker dependency."""
    return RoleChecker(*roles)


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    # Check for forwarded headers (behind proxy)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Direct connection
    if request.client:
        return request.client.host
    
    return "unknown"


def get_user_agent(request: Request) -> Optional[str]:
    """Get user agent from request."""
    return request.headers.get("User-Agent")
