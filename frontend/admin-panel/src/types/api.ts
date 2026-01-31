// Enums (из backend)
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  LOCKED = 'locked',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  MANAGE = 'manage',
}

export enum PermissionScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
  OWN = 'own',
}

export enum DeviceType {
  WEB = 'web',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  API = 'api',
}

export enum NotificationType {
  SYSTEM = 'system',
  SECURITY = 'security',
  PERSONAL = 'personal',
  BROADCAST = 'broadcast',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Base types
export interface MessageResponse {
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// User types
export interface User {
  id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: UserStatus;
  email_verified: boolean;
  locale: string;
  timezone: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRoles extends User {
  roles: RoleBrief[];
}

export interface UserCreate {
  email: string;
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  locale?: string;
  timezone?: string;
}

export interface UserUpdate {
  email?: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  locale?: string;
  timezone?: string;
}

export interface UserUpdateAdmin extends UserUpdate {
  status?: UserStatus;
  email_verified?: boolean;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

// Role types
export interface RoleBrief {
  id: string;
  name: string;
  description: string | null;
  priority: number;
}

export interface Role extends RoleBrief {
  is_system: boolean;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: PermissionAction;
  scope: PermissionScope;
  description: string | null;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
  device_id?: string;
  device_name?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
}

export interface LoginResponse {
  user: User;
  tokens: TokenResponse;
}

export interface TokenRefreshRequest {
  refresh_token: string;
}

// Session types
export interface Session {
  id: string;
  device_id: string | null;
  device_name: string | null;
  device_type: DeviceType;
  ip_address: string | null;
  user_agent: string | null;
  is_current: boolean;
  last_activity_at: string;
  created_at: string;
  expires_at: string;
}

// Notification types
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

// Audit types
export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failure';
  created_at: string;
}
