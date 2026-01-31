"""Role and Permission models for RBAC."""

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship, foreign

from app.models.base import Base, UUIDMixin, TimestampMixin, generate_uuid
from app.models.enums import PermissionAction, PermissionScope

if TYPE_CHECKING:
    from app.models.user import User


class Permission(Base, UUIDMixin):
    """Permission model for granular access control."""
    
    __tablename__ = "permissions"
    
    resource: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    
    action: Mapped[PermissionAction] = mapped_column(
        SQLEnum(
            PermissionAction,
            name="permission_action",
            create_constraint=False,
            native_enum=True,
            values_callable=lambda x: [e.value for e in x]
        ),
        nullable=False,
    )
    
    scope: Mapped[PermissionScope] = mapped_column(
        SQLEnum(
            PermissionScope,
            name="permission_scope",
            create_constraint=False,
            native_enum=True,
            values_callable=lambda x: [e.value for e in x]
        ),
        default=PermissionScope.GLOBAL,
        nullable=False,
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    
    # Relationships
    roles: Mapped[List["Role"]] = relationship(
        "Role",
        secondary="role_permissions",
        back_populates="permissions",
    )
    
    __table_args__ = (
        UniqueConstraint("resource", "action", "scope", name="uq_permission_resource_action_scope"),
    )
    
    def __repr__(self) -> str:
        return f"<Permission(resource={self.resource}, action={self.action}, scope={self.scope})>"


class Role(Base, UUIDMixin, TimestampMixin):
    """Role model for role-based access control."""
    
    __tablename__ = "roles"
    
    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    
    priority: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    
    is_system: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    parent_role_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("roles.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Relationships
    parent_role: Mapped[Optional["Role"]] = relationship(
        "Role",
        remote_side="Role.id",
        back_populates="child_roles",
    )
    
    child_roles: Mapped[List["Role"]] = relationship(
        "Role",
        back_populates="parent_role",
    )
    
    permissions: Mapped[List["Permission"]] = relationship(
        "Permission",
        secondary="role_permissions",
        back_populates="roles",
        lazy="selectin",
    )
    
    users: Mapped[List["User"]] = relationship(
        "User",
        secondary="user_roles",
        back_populates="roles",
        primaryjoin="Role.id == foreign(UserRole.role_id)",
        secondaryjoin="User.id == foreign(UserRole.user_id)",
    )
    
    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name={self.name}, priority={self.priority})>"


class RolePermission(Base):
    """Association table for Role-Permission many-to-many."""
    
    __tablename__ = "role_permissions"
    
    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    
    permission_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
    )
    
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    
    granted_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )


class UserRole(Base):
    """Association table for User-Role many-to-many with extra data."""
    
    __tablename__ = "user_roles"
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    
    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    
    assigned_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
