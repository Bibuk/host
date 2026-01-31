"""User service for CRUD operations."""

from datetime import datetime
from typing import List, Optional, Tuple
import uuid

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_password_hash, verify_password
from app.core.exceptions import (
    BadRequestError,
    ConflictError,
    NotFoundError,
    PasswordError,
)
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.enums import UserStatus
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserUpdateAdmin,
    PasswordChange,
)


class UserService:
    """Service for user CRUD operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(
        self,
        user_id: uuid.UUID,
        include_deleted: bool = False,
    ) -> Optional[User]:
        """Get user by ID."""
        query = select(User).options(selectinload(User.roles)).where(User.id == user_id)
        
        if not include_deleted:
            query = query.where(User.deleted_at.is_(None))
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_email(
        self,
        email: str,
        include_deleted: bool = False,
    ) -> Optional[User]:
        """Get user by email."""
        query = select(User).where(User.email == email.lower())
        
        if not include_deleted:
            query = query.where(User.deleted_at.is_(None))
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_username(
        self,
        username: str,
        include_deleted: bool = False,
    ) -> Optional[User]:
        """Get user by username."""
        query = select(User).where(User.username == username.lower())
        
        if not include_deleted:
            query = query.where(User.deleted_at.is_(None))
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def list_users(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        status: Optional[UserStatus] = None,
        include_deleted: bool = False,
    ) -> Tuple[List[User], int]:
        """
        List users with pagination and filters.
        
        Args:
            page: Page number (1-based)
            page_size: Items per page
            search: Search in email, username, first_name, last_name
            status: Filter by status
            include_deleted: Include soft-deleted users
            
        Returns:
            Tuple of (users list, total count)
        """
        query = select(User).options(selectinload(User.roles))
        count_query = select(func.count(User.id))
        
        # Apply filters
        if not include_deleted:
            query = query.where(User.deleted_at.is_(None))
            count_query = count_query.where(User.deleted_at.is_(None))
        
        if status:
            query = query.where(User.status == status)
            count_query = count_query.where(User.status == status)
        
        if search:
            search_filter = or_(
                User.email.ilike(f"%{search}%"),
                User.username.ilike(f"%{search}%"),
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        
        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(User.created_at.desc())
        
        result = await self.db.execute(query)
        users = list(result.scalars().all())
        
        return users, total
    
    async def create_user(
        self,
        data: UserCreate,
        created_by: Optional[uuid.UUID] = None,
    ) -> User:
        """
        Create a new user.
        
        Args:
            data: User creation data
            created_by: ID of user creating this user
            
        Returns:
            Created user
            
        Raises:
            ConflictError: If email or username already exists
        """
        # Check for existing email
        existing = await self.get_by_email(data.email)
        if existing:
            raise ConflictError("Email already registered")
        
        # Check for existing username
        if data.username:
            existing = await self.get_by_username(data.username)
            if existing:
                raise ConflictError("Username already taken")
        
        # Create user
        user = User(
            email=data.email.lower(),
            username=data.username.lower() if data.username else None,
            password_hash=get_password_hash(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            locale=data.locale,
            timezone=data.timezone,
            status=UserStatus.PENDING_VERIFICATION,
        )
        
        self.db.add(user)
        await self.db.flush()
        
        return user
    
    async def update_user(
        self,
        user_id: uuid.UUID,
        data: UserUpdate,
        updated_by: Optional[uuid.UUID] = None,
    ) -> User:
        """
        Update user.
        
        Args:
            user_id: User ID to update
            data: Update data
            updated_by: ID of user making the update
            
        Returns:
            Updated user
            
        Raises:
            NotFoundError: If user not found
            ConflictError: If email or username already taken
        """
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))
        
        # Check for email conflict
        if data.email and data.email.lower() != user.email:
            existing = await self.get_by_email(data.email)
            if existing:
                raise ConflictError("Email already registered")
            user.email = data.email.lower()
        
        # Check for username conflict
        if data.username is not None:
            if data.username and data.username.lower() != user.username:
                existing = await self.get_by_username(data.username)
                if existing:
                    raise ConflictError("Username already taken")
            user.username = data.username.lower() if data.username else None
        
        # Update other fields
        update_fields = ["first_name", "last_name", "phone", "avatar_url", "locale", "timezone"]
        for field in update_fields:
            value = getattr(data, field, None)
            if value is not None:
                setattr(user, field, value)
        
        return user
    
    async def update_user_admin(
        self,
        user_id: uuid.UUID,
        data: UserUpdateAdmin,
        updated_by: uuid.UUID,
    ) -> User:
        """
        Update user as admin (includes status changes).
        
        Args:
            user_id: User ID to update
            data: Update data
            updated_by: ID of admin making the update
            
        Returns:
            Updated user
        """
        user = await self.update_user(user_id, data, updated_by)
        
        if data.status is not None:
            user.status = data.status
        
        if data.email_verified is not None:
            user.email_verified = data.email_verified
        
        return user
    
    async def change_password(
        self,
        user_id: uuid.UUID,
        data: PasswordChange,
    ) -> User:
        """
        Change user password.
        
        Args:
            user_id: User ID
            data: Password change data
            
        Returns:
            Updated user
            
        Raises:
            PasswordError: If current password is wrong
        """
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))
        
        # Verify current password
        if not verify_password(data.current_password, user.password_hash):
            raise PasswordError("Current password is incorrect")
        
        # Update password
        user.password_hash = get_password_hash(data.new_password)
        
        return user
    
    async def delete_user(
        self,
        user_id: uuid.UUID,
        deleted_by: Optional[uuid.UUID] = None,
        hard_delete: bool = False,
    ) -> bool:
        """
        Delete user (soft delete by default).
        
        Args:
            user_id: User ID to delete
            deleted_by: ID of user performing deletion
            hard_delete: If True, permanently delete
            
        Returns:
            True if deleted
            
        Raises:
            NotFoundError: If user not found
        """
        user = await self.get_by_id(user_id, include_deleted=hard_delete)
        if not user:
            raise NotFoundError("User", str(user_id))
        
        if hard_delete:
            await self.db.delete(user)
        else:
            user.soft_delete()
        
        return True
    
    async def restore_user(self, user_id: uuid.UUID) -> User:
        """
        Restore soft-deleted user.
        
        Args:
            user_id: User ID to restore
            
        Returns:
            Restored user
            
        Raises:
            NotFoundError: If user not found
            BadRequestError: If user is not deleted
        """
        user = await self.get_by_id(user_id, include_deleted=True)
        if not user:
            raise NotFoundError("User", str(user_id))
        
        if not user.is_deleted:
            raise BadRequestError("User is not deleted")
        
        user.restore()
        return user
    
    async def assign_role(
        self,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        assigned_by: uuid.UUID,
        expires_at: Optional[datetime] = None,
    ) -> User:
        """
        Assign role to user.
        
        Args:
            user_id: User ID
            role_id: Role ID to assign
            assigned_by: ID of user assigning the role
            expires_at: Optional expiration for the role assignment
            
        Returns:
            Updated user
        """
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User", str(user_id))
        
        # Get role
        result = await self.db.execute(select(Role).where(Role.id == role_id))
        role = result.scalar_one_or_none()
        if not role:
            raise NotFoundError("Role", str(role_id))
        
        # Check if already assigned
        result = await self.db.execute(
            select(UserRole)
            .where(UserRole.user_id == user_id)
            .where(UserRole.role_id == role_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update expiration
            existing.expires_at = expires_at
        else:
            # Create assignment
            user_role = UserRole(
                user_id=user_id,
                role_id=role_id,
                assigned_by=assigned_by,
                expires_at=expires_at,
            )
            self.db.add(user_role)
        
        await self.db.flush()
        
        # Refresh user with roles
        return await self.get_by_id(user_id)
    
    async def remove_role(
        self,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
    ) -> User:
        """
        Remove role from user.
        
        Args:
            user_id: User ID
            role_id: Role ID to remove
            
        Returns:
            Updated user
        """
        result = await self.db.execute(
            select(UserRole)
            .where(UserRole.user_id == user_id)
            .where(UserRole.role_id == role_id)
        )
        user_role = result.scalar_one_or_none()
        
        if user_role:
            await self.db.delete(user_role)
        
        return await self.get_by_id(user_id)
