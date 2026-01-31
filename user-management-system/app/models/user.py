"""User model."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Index, String, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, JSONType
from app.models.enums import UserStatus

if TYPE_CHECKING:
    from app.models.role import Role
    from app.models.session import Session
    from app.models.notification import Notification


class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """User model representing application users."""
    
    __tablename__ = "users"
    
    # Core fields
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    
    username: Mapped[Optional[str]] = mapped_column(
        String(50),
        unique=True,
        nullable=True,
        index=True,
    )
    
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    
    # Profile fields
    first_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    
    last_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    
    phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )
    
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Status fields
    status: Mapped[UserStatus] = mapped_column(
        SQLEnum(
            UserStatus,
            name="user_status",
            create_constraint=False,
            native_enum=True,
            values_callable=lambda x: [e.value for e in x]
        ),
        default=UserStatus.PENDING_VERIFICATION,
        nullable=False,
        index=True,
    )
    
    email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    # Preferences
    locale: Mapped[str] = mapped_column(
        String(10),
        default="en",
        nullable=False,
    )
    
    timezone: Mapped[str] = mapped_column(
        String(50),
        default="UTC",
        nullable=False,
    )
    
    # Metadata
    metadata_: Mapped[dict] = mapped_column(
        "metadata",
        JSONType,
        default=dict,
        nullable=False,
    )
    
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
    )
    
    # Relationships
    roles: Mapped[List["Role"]] = relationship(
        "Role",
        secondary="user_roles",
        back_populates="users",
        lazy="selectin",
        primaryjoin="User.id == foreign(UserRole.user_id)",
        secondaryjoin="Role.id == foreign(UserRole.role_id)",
    )
    
    sessions: Mapped[List["Session"]] = relationship(
        "Session",
        back_populates="user",
        lazy="select",
        cascade="all, delete-orphan",
        foreign_keys="Session.user_id",
    )
    
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        lazy="select",
        cascade="all, delete-orphan",
    )
    
    # Table configuration
    __table_args__ = (
        Index("ix_users_email_not_deleted", "email", postgresql_where="deleted_at IS NULL"),
        Index("ix_users_status_not_deleted", "status", postgresql_where="deleted_at IS NULL"),
    )
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        parts = [self.first_name, self.last_name]
        return " ".join(filter(None, parts)) or self.email
    
    @property
    def is_active(self) -> bool:
        """Check if user is active."""
        return self.status == UserStatus.ACTIVE and not self.is_deleted
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, status={self.status})>"
