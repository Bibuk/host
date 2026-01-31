"""Notification model."""

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin, JSONType
from app.models.enums import NotificationType, NotificationPriority

if TYPE_CHECKING:
    from app.models.user import User


class Notification(Base, UUIDMixin):
    """Notification model for user notifications."""
    
    __tablename__ = "notifications"
    
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    
    type: Mapped[NotificationType] = mapped_column(
        SQLEnum(NotificationType, name="notification_type", create_constraint=True),
        default=NotificationType.PERSONAL,
        nullable=False,
    )
    
    priority: Mapped[NotificationPriority] = mapped_column(
        SQLEnum(NotificationPriority, name="notification_priority", create_constraint=True),
        default=NotificationPriority.NORMAL,
        nullable=False,
    )
    
    read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    action_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    
    metadata_: Mapped[dict] = mapped_column(
        "metadata",
        JSONType,
        default=dict,
        nullable=False,
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="notifications",
    )
    
    # Indexes
    __table_args__ = (
        Index(
            "ix_notifications_user_unread",
            "user_id", "read", "created_at",
            postgresql_where="read = false",
        ),
    )
    
    def mark_as_read(self) -> None:
        self.read = True
        self.read_at = datetime.now(timezone.utc)
    
    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type})>"
