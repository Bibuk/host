"""Audit log model."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import ForeignKey, Index, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin, JSONType
from app.models.enums import AuditStatus


class AuditLog(Base, UUIDMixin):
    """Audit log model for tracking all system events."""
    
    __tablename__ = "audit_logs"
    
    event_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    
    actor_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    actor_session_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    target_resource_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )
    
    target_resource_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        nullable=True,
    )
    
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    
    status: Mapped[AuditStatus] = mapped_column(
        SQLEnum(AuditStatus, name="audit_status", create_constraint=True),
        default=AuditStatus.SUCCESS,
        nullable=False,
    )
    
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
    )
    
    device_info: Mapped[dict] = mapped_column(
        JSONType,
        default=dict,
        nullable=False,
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
        index=True,
    )
    
    # Indexes
    __table_args__ = (
        Index("ix_audit_logs_actor_created", "actor_user_id", "created_at"),
        Index("ix_audit_logs_event_created", "event_type", "created_at"),
        Index("ix_audit_logs_target", "target_resource_type", "target_resource_id"),
    )
    
    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, event={self.event_type}, status={self.status})>"
