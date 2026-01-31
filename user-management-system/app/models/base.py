"""Base SQLAlchemy models and mixins."""

import uuid
import json
from datetime import datetime, timezone
from typing import Optional, Any

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB as PG_JSONB


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    
    Uses PostgreSQL's UUID type when available, otherwise uses
    CHAR(36), storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            else:
                return str(uuid.UUID(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            if isinstance(value, uuid.UUID):
                return value
            else:
                return uuid.UUID(value)


class JSONType(TypeDecorator):
    """Platform-independent JSON type.
    
    Uses PostgreSQL's JSONB when available, otherwise uses TEXT with JSON serialization.
    """
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_JSONB())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            if isinstance(value, str):
                return json.loads(value)
            return value


def generate_uuid() -> uuid.UUID:
    """Generate a new UUID4."""
    return uuid.uuid4()


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    
    type_annotation_map = {
        uuid.UUID: GUID(),
        datetime: DateTime(timezone=True),
    }


class UUIDMixin:
    """Mixin that adds UUID primary key."""
    
    id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=generate_uuid,
        nullable=False,
    )


class TimestampMixin:
    """Mixin that adds created_at and updated_at timestamps."""
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class SoftDeleteMixin:
    """Mixin that adds soft delete functionality."""
    
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    
    @property
    def is_deleted(self) -> bool:
        """Check if record is soft deleted."""
        return self.deleted_at is not None
    
    def soft_delete(self) -> None:
        """Mark record as deleted."""
        self.deleted_at = datetime.now(timezone.utc)
    
    def restore(self) -> None:
        """Restore soft deleted record."""
        self.deleted_at = None
