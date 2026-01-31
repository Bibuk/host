"""Enum types for database models."""

from enum import Enum


class UserStatus(str, Enum):
    """User account status."""
    
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    LOCKED = "locked"
    PENDING_VERIFICATION = "pending_verification"


class DeviceType(str, Enum):
    """Device types for sessions."""
    
    WEB = "web"
    MOBILE = "mobile"
    DESKTOP = "desktop"
    API = "api"


class PermissionAction(str, Enum):
    """Permission action types."""
    
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    EXECUTE = "execute"
    MANAGE = "manage"


class PermissionScope(str, Enum):
    """Permission scope levels."""
    
    GLOBAL = "global"
    ORGANIZATION = "organization"
    OWN = "own"


class NotificationType(str, Enum):
    """Notification types."""
    
    SYSTEM = "system"
    SECURITY = "security"
    PERSONAL = "personal"
    BROADCAST = "broadcast"


class NotificationPriority(str, Enum):
    """Notification priority levels."""
    
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class AuditStatus(str, Enum):
    """Audit log event status."""
    
    SUCCESS = "success"
    FAILURE = "failure"
