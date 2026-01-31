"""Base Pydantic schemas."""

import re
from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict


def validate_password_strength(password: str) -> str:
    """
    Validate password strength.
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password: The password to validate
        
    Returns:
        The validated password
        
    Raises:
        ValueError: If password doesn't meet requirements
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not any(c.isupper() for c in password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.islower() for c in password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one digit")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]', password):
        raise ValueError("Password must contain at least one special character")
    return password


class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        use_enum_values=True,
    )


class TimestampSchema(BaseSchema):
    """Schema with timestamp fields."""
    
    created_at: datetime
    updated_at: datetime


class IDSchema(BaseSchema):
    """Schema with UUID id."""
    
    id: UUID


# Generic type for pagination
T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response schema."""
    
    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int
    
    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PaginatedResponse[T]":
        """Create paginated response."""
        pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )


class MessageResponse(BaseSchema):
    """Simple message response."""
    
    message: str
    success: bool = True


class ErrorResponse(BaseSchema):
    """Error response schema."""
    
    detail: str
    error_code: Optional[str] = None
