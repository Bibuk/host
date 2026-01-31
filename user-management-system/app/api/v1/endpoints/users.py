"""User API endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_permission,
    require_role,
)
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.models.enums import UserStatus
from app.services.user_service import UserService
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserUpdateAdmin,
    UserResponse,
    UserWithRoles,
    PasswordChange,
)
from app.schemas.base import MessageResponse, PaginatedResponse


router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "",
    response_model=PaginatedResponse[UserResponse],
    summary="List users",
)
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in email, username, name"),
    status: Optional[UserStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(require_permission("users", "read")),
    db: AsyncSession = Depends(get_db),
):
    """
    List all users with pagination and filters.
    
    Requires `users:read` permission.
    """
    user_service = UserService(db)
    users, total = await user_service.list_users(
        page=page,
        page_size=page_size,
        search=search,
        status=status,
    )
    
    return PaginatedResponse.create(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user",
)
async def create_user(
    data: UserCreate,
    current_user: User = Depends(require_permission("users", "create")),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new user.
    
    Requires `users:create` permission.
    """
    user_service = UserService(db)
    user = await user_service.create_user(data, created_by=current_user.id)
    return user


@router.get(
    "/me",
    response_model=UserWithRoles,
    summary="Get current user",
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Get current authenticated user with roles.
    """
    return current_user


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update current user",
)
async def update_current_user(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current user profile.
    """
    user_service = UserService(db)
    user = await user_service.update_user(
        current_user.id,
        data,
        updated_by=current_user.id,
    )
    return user


@router.post(
    "/me/password",
    response_model=MessageResponse,
    summary="Change password",
)
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change current user password.
    """
    user_service = UserService(db)
    await user_service.change_password(current_user.id, data)
    return MessageResponse(message="Password changed successfully")


@router.get(
    "/{user_id}",
    response_model=UserWithRoles,
    summary="Get user by ID",
)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(require_permission("users", "read")),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user by ID.
    
    Requires `users:read` permission.
    """
    user_service = UserService(db)
    user = await user_service.get_by_id(user_id)
    if not user:
        raise NotFoundError("User", str(user_id))
    return user


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user",
)
async def update_user(
    user_id: UUID,
    data: UserUpdateAdmin,
    current_user: User = Depends(require_permission("users", "update")),
    db: AsyncSession = Depends(get_db),
):
    """
    Update user by ID (admin).
    
    Requires `users:update` permission.
    """
    user_service = UserService(db)
    user = await user_service.update_user_admin(
        user_id,
        data,
        updated_by=current_user.id,
    )
    return user


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    summary="Delete user",
)
async def delete_user(
    user_id: UUID,
    hard_delete: bool = Query(False, description="Permanently delete"),
    current_user: User = Depends(require_permission("users", "delete")),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete user (soft delete by default).
    
    Requires `users:delete` permission.
    """
    user_service = UserService(db)
    await user_service.delete_user(
        user_id,
        deleted_by=current_user.id,
        hard_delete=hard_delete,
    )
    return MessageResponse(message="User deleted successfully")


@router.post(
    "/{user_id}/restore",
    response_model=UserResponse,
    summary="Restore deleted user",
)
async def restore_user(
    user_id: UUID,
    current_user: User = Depends(require_permission("users", "update")),
    db: AsyncSession = Depends(get_db),
):
    """
    Restore soft-deleted user.
    
    Requires `users:update` permission.
    """
    user_service = UserService(db)
    user = await user_service.restore_user(user_id)
    return user


@router.post(
    "/{user_id}/roles/{role_id}",
    response_model=UserWithRoles,
    summary="Assign role to user",
)
async def assign_role(
    user_id: UUID,
    role_id: UUID,
    current_user: User = Depends(require_permission("users", "manage")),
    db: AsyncSession = Depends(get_db),
):
    """
    Assign role to user.
    
    Requires `users:manage` permission.
    """
    user_service = UserService(db)
    user = await user_service.assign_role(
        user_id,
        role_id,
        assigned_by=current_user.id,
    )
    return user


@router.delete(
    "/{user_id}/roles/{role_id}",
    response_model=UserWithRoles,
    summary="Remove role from user",
)
async def remove_role(
    user_id: UUID,
    role_id: UUID,
    current_user: User = Depends(require_permission("users", "manage")),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove role from user.
    
    Requires `users:manage` permission.
    """
    user_service = UserService(db)
    user = await user_service.remove_role(user_id, role_id)
    return user
