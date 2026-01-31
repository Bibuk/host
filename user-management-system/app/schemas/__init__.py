"""Pydantic schemas."""

from app.schemas.base import (
    BaseSchema,
    IDSchema,
    TimestampSchema,
    PaginatedResponse,
    MessageResponse,
    ErrorResponse,
)
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserUpdateAdmin,
    UserResponse,
    UserResponseBrief,
    UserWithRoles,
    PasswordChange,
    PasswordReset,
    PasswordResetConfirm,
)
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    LoginResponse,
    VerifyEmailRequest,
    LogoutRequest,
)
from app.schemas.role import (
    PermissionCreate,
    PermissionUpdate,
    PermissionResponse,
    RoleCreate,
    RoleUpdate,
    RoleResponse,
    RoleResponseBrief,
    RoleWithPermissions,
    AssignRoleRequest,
    RemoveRoleRequest,
)
from app.schemas.session import (
    SessionResponse,
    SessionListResponse,
    RevokeSessionRequest,
    RevokeAllSessionsRequest,
)
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationListResponse,
    MarkNotificationReadRequest,
)
from app.schemas.audit import (
    AuditLogCreate,
    AuditLogResponse,
    AuditLogFilter,
    AuditLogListResponse,
)

__all__ = [
    # Base
    "BaseSchema",
    "IDSchema",
    "TimestampSchema",
    "PaginatedResponse",
    "MessageResponse",
    "ErrorResponse",
    # User
    "UserCreate",
    "UserUpdate",
    "UserUpdateAdmin",
    "UserResponse",
    "UserResponseBrief",
    "UserWithRoles",
    "PasswordChange",
    "PasswordReset",
    "PasswordResetConfirm",
    # Auth
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "TokenRefreshRequest",
    "TokenRefreshResponse",
    "LoginResponse",
    "VerifyEmailRequest",
    "LogoutRequest",
    # Role
    "PermissionCreate",
    "PermissionUpdate",
    "PermissionResponse",
    "RoleCreate",
    "RoleUpdate",
    "RoleResponse",
    "RoleResponseBrief",
    "RoleWithPermissions",
    "AssignRoleRequest",
    "RemoveRoleRequest",
    # Session
    "SessionResponse",
    "SessionListResponse",
    "RevokeSessionRequest",
    "RevokeAllSessionsRequest",
    # Notification
    "NotificationCreate",
    "NotificationResponse",
    "NotificationListResponse",
    "MarkNotificationReadRequest",
    # Audit
    "AuditLogCreate",
    "AuditLogResponse",
    "AuditLogFilter",
    "AuditLogListResponse",
]
