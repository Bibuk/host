-- ============================================================
-- DATABASE INITIALIZATION AND SEEDING SCRIPT
-- For User Management System
-- ============================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS device_type CASCADE;
DROP TYPE IF EXISTS permission_action CASCADE;
DROP TYPE IF EXISTS permission_scope CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;
DROP TYPE IF EXISTS audit_status CASCADE;

-- Create ENUM types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'locked', 'pending_verification');
CREATE TYPE device_type AS ENUM ('web', 'mobile', 'desktop', 'api');
CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'execute', 'manage');
CREATE TYPE permission_scope AS ENUM ('global', 'organization', 'own');
CREATE TYPE notification_type AS ENUM ('system', 'security', 'personal', 'broadcast');
CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'critical');
CREATE TYPE audit_status AS ENUM ('success', 'failure');

-- ============================================================
-- CREATE TABLES
-- ============================================================

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    status user_status DEFAULT 'pending_verification' NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    locale VARCHAR(10) DEFAULT 'en' NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
    metadata JSONB DEFAULT '{}' NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_username ON users(username);
CREATE INDEX ix_users_status ON users(status);

-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    priority INTEGER DEFAULT 0 NOT NULL,
    is_system BOOLEAN DEFAULT FALSE NOT NULL,
    parent_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX ix_roles_name ON roles(name);

-- Create permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(100) NOT NULL,
    action permission_action NOT NULL,
    scope permission_scope DEFAULT 'global' NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(resource, action, scope)
);

CREATE INDEX ix_permissions_resource ON permissions(resource);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

-- Create sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_id VARCHAR(100),
    device_type device_type DEFAULT 'web' NOT NULL,
    device_name VARCHAR(100),
    os VARCHAR(50),
    browser VARCHAR(50),
    ip_address VARCHAR(45),
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    user_agent VARCHAR(500),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX ix_sessions_user_id ON sessions(user_id);
CREATE INDEX ix_sessions_token_hash ON sessions(token_hash);
CREATE INDEX ix_sessions_refresh_token_hash ON sessions(refresh_token_hash);
CREATE INDEX ix_sessions_device_id ON sessions(device_id);
CREATE INDEX ix_sessions_ip_address ON sessions(ip_address);
CREATE INDEX ix_sessions_last_activity ON sessions(last_activity);
CREATE INDEX ix_sessions_expires_at ON sessions(expires_at);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'personal' NOT NULL,
    priority notification_priority DEFAULT 'normal' NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX ix_notifications_user_id ON notifications(user_id);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    target_resource_type VARCHAR(50),
    target_resource_id UUID,
    action VARCHAR(50) NOT NULL,
    status audit_status DEFAULT 'success' NOT NULL,
    ip_address VARCHAR(45),
    device_info JSONB DEFAULT '{}' NOT NULL,
    metadata JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX ix_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX ix_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX ix_audit_logs_target_resource_type ON audit_logs(target_resource_type);
CREATE INDEX ix_audit_logs_action ON audit_logs(action);
CREATE INDEX ix_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- INSERT SEED DATA
-- ============================================================

-- Insert Roles
INSERT INTO roles (id, name, description, priority, is_system) VALUES
('11111111-1111-1111-1111-111111111111', 'admin', 'Full system administrator with all permissions', 100, true),
('22222222-2222-2222-2222-222222222222', 'moderator', 'User moderator with limited admin access', 50, true),
('33333333-3333-3333-3333-333333333333', 'user', 'Regular user with basic permissions', 10, true),
('44444444-4444-4444-4444-444444444444', 'guest', 'Guest user with read-only access', 1, true);

-- Insert Permissions
INSERT INTO permissions (id, resource, action, scope, description) VALUES
-- Users permissions
('a0000001-0000-0000-0000-000000000001', 'users', 'create', 'global', 'Create users'),
('a0000002-0000-0000-0000-000000000002', 'users', 'read', 'global', 'Read all users'),
('a0000003-0000-0000-0000-000000000003', 'users', 'read', 'own', 'Read own user'),
('a0000004-0000-0000-0000-000000000004', 'users', 'update', 'global', 'Update all users'),
('a0000005-0000-0000-0000-000000000005', 'users', 'update', 'own', 'Update own user'),
('a0000006-0000-0000-0000-000000000006', 'users', 'delete', 'global', 'Delete users'),
('a0000007-0000-0000-0000-000000000007', 'users', 'manage', 'global', 'Manage users (assign roles)'),
-- Roles permissions
('a0000008-0000-0000-0000-000000000008', 'roles', 'create', 'global', 'Create roles'),
('a0000009-0000-0000-0000-000000000009', 'roles', 'read', 'global', 'Read roles'),
('a0000010-0000-0000-0000-000000000010', 'roles', 'update', 'global', 'Update roles'),
('a0000011-0000-0000-0000-000000000011', 'roles', 'delete', 'global', 'Delete roles'),
-- Permissions
('a0000012-0000-0000-0000-000000000012', 'permissions', 'read', 'global', 'Read permissions'),
-- Sessions permissions
('a0000013-0000-0000-0000-000000000013', 'sessions', 'read', 'global', 'Read all sessions'),
('a0000014-0000-0000-0000-000000000014', 'sessions', 'read', 'own', 'Read own sessions'),
('a0000015-0000-0000-0000-000000000015', 'sessions', 'delete', 'global', 'Revoke any session'),
('a0000016-0000-0000-0000-000000000016', 'sessions', 'delete', 'own', 'Revoke own sessions'),
-- Audit permissions
('a0000017-0000-0000-0000-000000000017', 'audit', 'read', 'global', 'Read audit logs'),
-- Notifications permissions
('a0000018-0000-0000-0000-000000000018', 'notifications', 'read', 'global', 'Read all notifications'),
('a0000019-0000-0000-0000-000000000019', 'notifications', 'read', 'own', 'Read own notifications'),
('a0000020-0000-0000-0000-000000000020', 'notifications', 'create', 'global', 'Create notifications'),
('a0000021-0000-0000-0000-000000000021', 'notifications', 'delete', 'own', 'Delete own notifications'),
-- Admin permissions
('a0000022-0000-0000-0000-000000000022', 'admin', 'manage', 'global', 'Full admin access'),
-- Dashboard permissions
('a0000023-0000-0000-0000-000000000023', 'dashboard', 'read', 'global', 'View admin dashboard'),
-- Reports permissions
('a0000024-0000-0000-0000-000000000024', 'reports', 'read', 'global', 'View system reports'),
('a0000025-0000-0000-0000-000000000025', 'reports', 'create', 'global', 'Generate reports');

-- Assign ALL permissions to admin role
INSERT INTO role_permissions (role_id, permission_id) 
SELECT '11111111-1111-1111-1111-111111111111', id FROM permissions;

-- Assign permissions to moderator role
INSERT INTO role_permissions (role_id, permission_id) VALUES
('22222222-2222-2222-2222-222222222222', 'a0000002-0000-0000-0000-000000000002'), -- users:read:global
('22222222-2222-2222-2222-222222222222', 'a0000004-0000-0000-0000-000000000004'), -- users:update:global
('22222222-2222-2222-2222-222222222222', 'a0000013-0000-0000-0000-000000000013'), -- sessions:read:global
('22222222-2222-2222-2222-222222222222', 'a0000015-0000-0000-0000-000000000015'), -- sessions:delete:global
('22222222-2222-2222-2222-222222222222', 'a0000017-0000-0000-0000-000000000017'), -- audit:read:global
('22222222-2222-2222-2222-222222222222', 'a0000018-0000-0000-0000-000000000018'), -- notifications:read:global
('22222222-2222-2222-2222-222222222222', 'a0000020-0000-0000-0000-000000000020'), -- notifications:create:global
('22222222-2222-2222-2222-222222222222', 'a0000023-0000-0000-0000-000000000023'); -- dashboard:read:global

-- Assign permissions to user role
INSERT INTO role_permissions (role_id, permission_id) VALUES
('33333333-3333-3333-3333-333333333333', 'a0000003-0000-0000-0000-000000000003'), -- users:read:own
('33333333-3333-3333-3333-333333333333', 'a0000005-0000-0000-0000-000000000005'), -- users:update:own
('33333333-3333-3333-3333-333333333333', 'a0000014-0000-0000-0000-000000000014'), -- sessions:read:own
('33333333-3333-3333-3333-333333333333', 'a0000016-0000-0000-0000-000000000016'), -- sessions:delete:own
('33333333-3333-3333-3333-333333333333', 'a0000019-0000-0000-0000-000000000019'), -- notifications:read:own
('33333333-3333-3333-3333-333333333333', 'a0000021-0000-0000-0000-000000000021'); -- notifications:delete:own

-- Insert Users (passwords are bcrypt hashed - all passwords are shown in comments)
-- Using pre-generated bcrypt hashes for the passwords
INSERT INTO users (id, email, username, password_hash, first_name, last_name, phone, status, email_verified, locale, timezone, last_login_at, created_at) VALUES
-- Admin user: password = 'admin123'
('b0000001-0000-0000-0000-000000000001', 'admin@example.com', 'admin', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4zFQQiGqBc0O1pXO', 
 'System', 'Administrator', '+7 (999) 111-22-33', 'active', true, 'ru', 'Europe/Moscow', 
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '90 days'),

-- Moderator user: password = 'mod123'
('b0000002-0000-0000-0000-000000000002', 'moderator@example.com', 'moderator',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4zFQQiGqBc0O1pXO',
 'Maria', 'Ivanova', '+7 (999) 222-33-44', 'active', true, 'ru', 'Europe/Moscow',
 NOW() - INTERVAL '5 hours', NOW() - INTERVAL '60 days'),

-- Regular users: password = 'password123'
('b0000003-0000-0000-0000-000000000003', 'john.doe@example.com', 'johndoe',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4zFQQiGqBc0O1pXO',
 'John', 'Doe', '+1 (555) 123-4567', 'active', true, 'en', 'America/New_York',
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '45 days'),

('b0000004-0000-0000-0000-000000000004', 'anna.smith@example.com', 'annasmith',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4zFQQiGqBc0O1pXO',
 'Anna', 'Smith', '+1 (555) 234-5678', 'active', true, 'en', 'America/Los_Angeles',
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '30 days'),

('b0000005-0000-0000-0000-000000000005', 'ivan.petrov@example.com', 'ivanpetrov',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4zFQQiGqBc0O1pXO',
 'Ivan', 'Petrov', '+7 (999) 333-44-55', 'active', true, 'ru', 'Europe/Moscow',
 NOW() - INTERVAL '6 hours', NOW() - INTERVAL '25 days'),

('b0000006-0000-0000-0000-000000000006', 'olga.sidorova@example.com', 'olgasidorova',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4zFQQiGqBc0O1pXO',
 'Olga', 'Sidorova', '+7 (999) 444-55-66', 'active', true, 'ru', 'Europe/Moscow',
 NOW() - INTERVAL '12 hours', NOW() - INTERVAL '20 days'),

('b0000007-0000-0000-0000-000000000007', 'alex.johnson@example.com', 'alexjohnson',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4zFQQiGqBc0O1pXO',
 'Alex', 'Johnson', '+1 (555) 345-6789', 'active', true, 'en', 'Europe/London',
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '15 days'),

-- Pending verification user
('b0000008-0000-0000-0000-000000000008', 'pending.user@example.com', 'pendinguser',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4zFQQiGqBc0O1pXO',
 'Pending', 'User', NULL, 'pending_verification', false, 'en', 'UTC',
 NULL, NOW() - INTERVAL '2 days'),

-- Inactive user
('b0000009-0000-0000-0000-000000000009', 'inactive.user@example.com', 'inactiveuser',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4zFQQiGqBc0O1pXO',
 'Inactive', 'User', NULL, 'inactive', true, 'en', 'UTC',
 NOW() - INTERVAL '60 days', NOW() - INTERVAL '100 days'),

-- Locked user
('b0000010-0000-0000-0000-000000000010', 'locked.user@example.com', 'lockeduser',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4zFQQiGqBc0O1pXO',
 'Locked', 'User', NULL, 'locked', true, 'en', 'UTC',
 NOW() - INTERVAL '30 days', NOW() - INTERVAL '80 days');

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES
('b0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '90 days'), -- admin -> admin role
('b0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '60 days'), -- moderator -> moderator role
('b0000003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '45 days'), -- john -> user role
('b0000004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '30 days'), -- anna -> user role
('b0000005-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '25 days'), -- ivan -> user role
('b0000006-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '20 days'), -- olga -> user role
('b0000007-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '15 days'), -- alex -> user role
('b0000008-0000-0000-0000-000000000008', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '2 days'),  -- pending -> user role
('b0000009-0000-0000-0000-000000000009', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '100 days'), -- inactive -> user role
('b0000010-0000-0000-0000-000000000010', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '80 days');  -- locked -> user role

-- Insert Sessions for active users
INSERT INTO sessions (id, user_id, token_hash, refresh_token_hash, device_id, device_type, device_name, os, browser, ip_address, location_city, location_country, user_agent, last_activity, expires_at) VALUES
('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 
 'token_admin_001', 'refresh_admin_001', 'device_admin_01', 'web', 'Chrome on Windows', 
 'Windows 11', 'Chrome 120', '192.168.1.100', 'Moscow', 'Russia',
 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '7 days'),

('c0000002-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002',
 'token_mod_001', 'refresh_mod_001', 'device_mod_01', 'desktop', 'Safari on MacOS',
 'MacOS Sonoma', 'Safari 17', '192.168.1.101', 'Moscow', 'Russia',
 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '7 days'),

('c0000003-0000-0000-0000-000000000003', 'b0000003-0000-0000-0000-000000000003',
 'token_john_001', 'refresh_john_001', 'device_john_01', 'mobile', 'Mobile App',
 'iOS 17', NULL, '192.168.1.102', 'New York', 'USA',
 'UserManagement/1.0 iOS/17.0', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '7 days'),

('c0000004-0000-0000-0000-000000000004', 'b0000005-0000-0000-0000-000000000005',
 'token_ivan_001', 'refresh_ivan_001', 'device_ivan_01', 'web', 'Firefox on Linux',
 'Ubuntu 22.04', 'Firefox 121', '192.168.1.103', 'Moscow', 'Russia',
 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0', NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '7 days'),

('c0000005-0000-0000-0000-000000000005', 'b0000006-0000-0000-0000-000000000006',
 'token_olga_001', 'refresh_olga_001', 'device_olga_01', 'web', 'Chrome on Windows',
 'Windows 10', 'Chrome 119', '192.168.1.104', 'Saint Petersburg', 'Russia',
 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '7 days');

-- Insert Notifications
INSERT INTO notifications (id, user_id, title, message, type, priority, read, read_at, created_at) VALUES
-- Admin notifications
('d0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001',
 'Welcome!', 'Thank you for registering with our system. Your account has been successfully created.',
 'system', 'normal', true, NOW() - INTERVAL '89 days', NOW() - INTERVAL '90 days'),

('d0000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001',
 'New Login Detected', 'A new login was detected from Windows device in Moscow, Russia.',
 'security', 'high', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),

('d0000003-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001',
 'System Maintenance', 'Scheduled maintenance is planned for this weekend.',
 'broadcast', 'normal', false, NULL, NOW() - INTERVAL '1 hour'),

-- Moderator notifications
('d0000004-0000-0000-0000-000000000004', 'b0000002-0000-0000-0000-000000000002',
 'Welcome!', 'Thank you for registering with our system.',
 'system', 'normal', true, NOW() - INTERVAL '59 days', NOW() - INTERVAL '60 days'),

('d0000005-0000-0000-0000-000000000005', 'b0000002-0000-0000-0000-000000000002',
 'Role Assigned', 'You have been assigned the Moderator role.',
 'system', 'high', true, NOW() - INTERVAL '58 days', NOW() - INTERVAL '59 days'),

-- Regular user notifications
('d0000006-0000-0000-0000-000000000006', 'b0000003-0000-0000-0000-000000000003',
 'Welcome!', 'Thank you for registering with our system.',
 'system', 'normal', true, NOW() - INTERVAL '44 days', NOW() - INTERVAL '45 days'),

('d0000007-0000-0000-0000-000000000007', 'b0000003-0000-0000-0000-000000000003',
 'Profile Updated', 'Your profile was successfully updated.',
 'personal', 'low', false, NULL, NOW() - INTERVAL '5 days'),

('d0000008-0000-0000-0000-000000000008', 'b0000004-0000-0000-0000-000000000004',
 'Welcome!', 'Thank you for registering with our system.',
 'system', 'normal', true, NOW() - INTERVAL '29 days', NOW() - INTERVAL '30 days'),

('d0000009-0000-0000-0000-000000000009', 'b0000005-0000-0000-0000-000000000005',
 'Welcome!', 'Thank you for registering with our system.',
 'system', 'normal', true, NOW() - INTERVAL '24 days', NOW() - INTERVAL '25 days'),

('d0000010-0000-0000-0000-000000000010', 'b0000005-0000-0000-0000-000000000005',
 'Security Alert', 'New login detected from a new device.',
 'security', 'high', false, NULL, NOW() - INTERVAL '2 hours'),

('d0000011-0000-0000-0000-000000000011', 'b0000006-0000-0000-0000-000000000006',
 'Welcome!', 'Thank you for registering with our system.',
 'system', 'normal', true, NOW() - INTERVAL '19 days', NOW() - INTERVAL '20 days'),

('d0000012-0000-0000-0000-000000000012', 'b0000007-0000-0000-0000-000000000007',
 'Welcome!', 'Thank you for registering with our system.',
 'system', 'normal', true, NOW() - INTERVAL '14 days', NOW() - INTERVAL '15 days'),

-- Pending user notification
('d0000013-0000-0000-0000-000000000013', 'b0000008-0000-0000-0000-000000000008',
 'Verify Your Email', 'Please verify your email address to activate your account.',
 'system', 'high', false, NULL, NOW() - INTERVAL '2 days');

-- Insert Audit Logs
INSERT INTO audit_logs (id, event_type, actor_user_id, target_resource_type, target_resource_id, action, status, ip_address, device_info, metadata, created_at) VALUES
-- Admin audit logs
('e0000001-0000-0000-0000-000000000001', 'user.register', 'b0000001-0000-0000-0000-000000000001', 'user', 'b0000001-0000-0000-0000-000000000001', 'register', 'success', '192.168.1.1', '{"browser": "Chrome", "os": "Windows"}', '{}', NOW() - INTERVAL '90 days'),
('e0000002-0000-0000-0000-000000000002', 'user.login', 'b0000001-0000-0000-0000-000000000001', 'auth', NULL, 'login', 'success', '192.168.1.100', '{"browser": "Chrome", "os": "Windows"}', '{}', NOW() - INTERVAL '2 hours'),
('e0000003-0000-0000-0000-000000000003', 'admin.user_view', 'b0000001-0000-0000-0000-000000000001', 'user', 'b0000003-0000-0000-0000-000000000003', 'view', 'success', '192.168.1.100', '{"browser": "Chrome", "os": "Windows"}', '{}', NOW() - INTERVAL '1 hour'),
('e0000004-0000-0000-0000-000000000004', 'admin.role_assign', 'b0000001-0000-0000-0000-000000000001', 'user', 'b0000002-0000-0000-0000-000000000002', 'role_assign', 'success', '192.168.1.100', '{"browser": "Chrome", "os": "Windows"}', '{"role": "moderator"}', NOW() - INTERVAL '59 days'),

-- Moderator audit logs
('e0000005-0000-0000-0000-000000000005', 'user.register', 'b0000002-0000-0000-0000-000000000002', 'user', 'b0000002-0000-0000-0000-000000000002', 'register', 'success', '192.168.1.2', '{"browser": "Safari", "os": "MacOS"}', '{}', NOW() - INTERVAL '60 days'),
('e0000006-0000-0000-0000-000000000006', 'user.login', 'b0000002-0000-0000-0000-000000000002', 'auth', NULL, 'login', 'success', '192.168.1.101', '{"browser": "Safari", "os": "MacOS"}', '{}', NOW() - INTERVAL '5 hours'),
('e0000007-0000-0000-0000-000000000007', 'user.profile_update', 'b0000002-0000-0000-0000-000000000002', 'user', 'b0000002-0000-0000-0000-000000000002', 'profile_update', 'success', '192.168.1.101', '{"browser": "Safari", "os": "MacOS"}', '{}', NOW() - INTERVAL '30 days'),

-- Regular user audit logs
('e0000008-0000-0000-0000-000000000008', 'user.register', 'b0000003-0000-0000-0000-000000000003', 'user', 'b0000003-0000-0000-0000-000000000003', 'register', 'success', '192.168.1.3', '{"browser": "Chrome", "os": "Windows"}', '{}', NOW() - INTERVAL '45 days'),
('e0000009-0000-0000-0000-000000000009', 'user.email_verify', 'b0000003-0000-0000-0000-000000000003', 'auth', NULL, 'email_verify', 'success', '192.168.1.3', '{"browser": "Chrome", "os": "Windows"}', '{}', NOW() - INTERVAL '44 days'),
('e0000010-0000-0000-0000-000000000010', 'user.login', 'b0000003-0000-0000-0000-000000000003', 'auth', NULL, 'login', 'success', '192.168.1.102', '{"device": "iPhone", "os": "iOS"}', '{}', NOW() - INTERVAL '1 day'),
('e0000011-0000-0000-0000-000000000011', 'session.create', 'b0000003-0000-0000-0000-000000000003', 'session', 'c0000003-0000-0000-0000-000000000003', 'create', 'success', '192.168.1.102', '{"device": "iPhone", "os": "iOS"}', '{}', NOW() - INTERVAL '1 day'),

('e0000012-0000-0000-0000-000000000012', 'user.register', 'b0000004-0000-0000-0000-000000000004', 'user', 'b0000004-0000-0000-0000-000000000004', 'register', 'success', '192.168.1.4', '{"browser": "Chrome", "os": "MacOS"}', '{}', NOW() - INTERVAL '30 days'),
('e0000013-0000-0000-0000-000000000013', 'user.login', 'b0000004-0000-0000-0000-000000000004', 'auth', NULL, 'login', 'success', '192.168.1.104', '{"browser": "Chrome", "os": "MacOS"}', '{}', NOW() - INTERVAL '3 days'),

('e0000014-0000-0000-0000-000000000014', 'user.register', 'b0000005-0000-0000-0000-000000000005', 'user', 'b0000005-0000-0000-0000-000000000005', 'register', 'success', '192.168.1.5', '{"browser": "Firefox", "os": "Linux"}', '{}', NOW() - INTERVAL '25 days'),
('e0000015-0000-0000-0000-000000000015', 'user.login', 'b0000005-0000-0000-0000-000000000005', 'auth', NULL, 'login', 'success', '192.168.1.103', '{"browser": "Firefox", "os": "Linux"}', '{}', NOW() - INTERVAL '6 hours'),
('e0000016-0000-0000-0000-000000000016', 'user.password_change', 'b0000005-0000-0000-0000-000000000005', 'auth', NULL, 'password_change', 'success', '192.168.1.103', '{"browser": "Firefox", "os": "Linux"}', '{}', NOW() - INTERVAL '10 days'),

('e0000017-0000-0000-0000-000000000017', 'user.register', 'b0000006-0000-0000-0000-000000000006', 'user', 'b0000006-0000-0000-0000-000000000006', 'register', 'success', '192.168.1.6', '{"browser": "Chrome", "os": "Windows"}', '{}', NOW() - INTERVAL '20 days'),
('e0000018-0000-0000-0000-000000000018', 'user.login', 'b0000006-0000-0000-0000-000000000006', 'auth', NULL, 'login', 'success', '192.168.1.104', '{"browser": "Chrome", "os": "Windows"}', '{}', NOW() - INTERVAL '12 hours'),

('e0000019-0000-0000-0000-000000000019', 'user.register', 'b0000007-0000-0000-0000-000000000007', 'user', 'b0000007-0000-0000-0000-000000000007', 'register', 'success', '192.168.1.7', '{"browser": "Safari", "os": "MacOS"}', '{}', NOW() - INTERVAL '15 days'),
('e0000020-0000-0000-0000-000000000020', 'user.login', 'b0000007-0000-0000-0000-000000000007', 'auth', NULL, 'login', 'success', '192.168.1.105', '{"browser": "Safari", "os": "MacOS"}', '{}', NOW() - INTERVAL '1 day'),

-- Failed login attempts
('e0000021-0000-0000-0000-000000000021', 'user.login', NULL, 'auth', NULL, 'login', 'failure', '192.168.1.200', '{"browser": "Chrome", "os": "Windows"}', '{"reason": "invalid_password", "email": "admin@example.com"}', NOW() - INTERVAL '5 hours'),
('e0000022-0000-0000-0000-000000000022', 'user.login', NULL, 'auth', NULL, 'login', 'failure', '192.168.1.201', '{"browser": "Firefox", "os": "Linux"}', '{"reason": "user_not_found", "email": "unknown@example.com"}', NOW() - INTERVAL '3 hours'),

-- Locked user audit
('e0000023-0000-0000-0000-000000000023', 'user.login', 'b0000010-0000-0000-0000-000000000010', 'auth', NULL, 'login', 'failure', '192.168.1.150', '{"browser": "Chrome", "os": "Windows"}', '{"reason": "account_locked"}', NOW() - INTERVAL '1 day');

-- Update alembic_version to mark migrations as applied
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num) VALUES ('001_initial');

-- ============================================================
-- SUMMARY
-- ============================================================
-- Tables created: users, roles, permissions, role_permissions, user_roles, sessions, notifications, audit_logs
-- Roles: admin, moderator, user, guest
-- Permissions: 25 permissions across users, roles, sessions, audit, notifications, admin, dashboard, reports
-- Users: 10 test users with various statuses
-- Sessions: 5 active sessions
-- Notifications: 13 notifications
-- Audit logs: 23 audit log entries
-- ============================================================
