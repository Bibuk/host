"""Session model for user authentication sessions."""

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, Index, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin
from app.models.enums import DeviceType

if TYPE_CHECKING:
    from app.models.user import User


class Session(Base, UUIDMixin):
    """Session model for tracking user authentication sessions."""
    
    __tablename__ = "sessions"
    
    # User reference
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    # Token hashes (never store plain tokens!)
    token_hash: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    
    refresh_token_hash: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    
    # Device information
    device_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )
    
    device_type: Mapped[DeviceType] = mapped_column(
        SQLEnum(DeviceType, name="device_type", create_constraint=True),
        default=DeviceType.WEB,
        nullable=False,
    )
    
    device_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    
    os: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    
    browser: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    
    # Network information
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),  # IPv6 max length
        nullable=True,
        index=True,
    )
    
    # Location (from IP geolocation)
    location_city: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    
    location_country: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    # Timestamps
    last_activity: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    
    # Revocation
    revoked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    revoked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    revoked_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="sessions",
        foreign_keys=[user_id],
    )
    
    # Indexes
    __table_args__ = (
        Index(
            "ix_sessions_user_active",
            "user_id", "revoked", "expires_at",
            postgresql_where="revoked = false",
        ),
    )
    
    @property
    def is_expired(self) -> bool:
        """Check if session has expired."""
        now = datetime.now(timezone.utc)
        expires = self.expires_at if self.expires_at.tzinfo else self.expires_at.replace(tzinfo=timezone.utc)
        return now > expires
    
    @property
    def is_active(self) -> bool:
        """Check if session is active (not revoked and not expired)."""
        return not self.revoked and not self.is_expired
    
    def revoke(self, revoked_by_user_id: Optional[uuid.UUID] = None) -> None:
        """Revoke this session."""
        self.revoked = True
        self.revoked_at = datetime.now(timezone.utc)
        self.revoked_by = revoked_by_user_id
    
    def update_activity(self) -> None:
        """Update last activity timestamp."""
        self.last_activity = datetime.now(timezone.utc)
    
    def __repr__(self) -> str:
        return f"<Session(id={self.id}, user_id={self.user_id}, active={self.is_active})>"
