"""Custom exceptions for the application."""

from typing import Any, Optional, Dict
from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception."""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class AuthenticationError(AppException):
    """Authentication failed."""
    
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(AppException):
    """Authorization failed - insufficient permissions."""
    
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class NotFoundError(AppException):
    """Resource not found."""
    
    def __init__(self, resource: str = "Resource", resource_id: Optional[str] = None):
        detail = f"{resource} not found"
        if resource_id:
            detail = f"{resource} with id '{resource_id}' not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )


class BadRequestError(AppException):
    """Bad request."""
    
    def __init__(self, detail: str = "Bad request"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


class ConflictError(AppException):
    """Resource conflict (duplicate)."""
    
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )


class ValidationError(AppException):
    """Validation error."""
    
    def __init__(self, detail: str = "Validation error"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )


class RateLimitError(AppException):
    """Rate limit exceeded."""
    
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
        )


class InternalError(AppException):
    """Internal server error."""
    
    def __init__(self, detail: str = "Internal server error"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )


class TokenExpiredError(AuthenticationError):
    """Token has expired."""
    
    def __init__(self):
        super().__init__(detail="Token has expired")


class TokenInvalidError(AuthenticationError):
    """Token is invalid."""
    
    def __init__(self):
        super().__init__(detail="Invalid token")


class UserInactiveError(AuthenticationError):
    """User account is inactive."""
    
    def __init__(self):
        super().__init__(detail="User account is inactive")


class UserLockedError(AuthenticationError):
    """User account is locked."""
    
    def __init__(self):
        super().__init__(detail="User account is locked")


class SessionRevokedError(AuthenticationError):
    """Session has been revoked."""
    
    def __init__(self):
        super().__init__(detail="Session has been revoked")


class PasswordError(BadRequestError):
    """Password validation error."""
    
    def __init__(self, detail: str = "Invalid password"):
        super().__init__(detail=detail)


class EmailNotVerifiedError(AuthorizationError):
    """Email not verified."""
    
    def __init__(self):
        super().__init__(detail="Email not verified")
