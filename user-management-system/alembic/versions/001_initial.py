"""Initial migration with all tables

Revision ID: 001_initial
Revises: 
Create Date: 2025-01-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types
    user_status = postgresql.ENUM(
        'active', 'inactive', 'suspended', 'locked', 'pending_verification',
        name='user_status', create_type=True
    )
    user_status.create(op.get_bind())
    
    device_type = postgresql.ENUM(
        'web', 'mobile', 'desktop', 'api',
        name='device_type', create_type=True
    )
    device_type.create(op.get_bind())
    
    permission_action = postgresql.ENUM(
        'create', 'read', 'update', 'delete', 'execute', 'manage',
        name='permission_action', create_type=True
    )
    permission_action.create(op.get_bind())
    
    permission_scope = postgresql.ENUM(
        'global', 'organization', 'own',
        name='permission_scope', create_type=True
    )
    permission_scope.create(op.get_bind())
    
    notification_type = postgresql.ENUM(
        'system', 'security', 'personal', 'broadcast',
        name='notification_type', create_type=True
    )
    notification_type.create(op.get_bind())
    
    notification_priority = postgresql.ENUM(
        'low', 'normal', 'high', 'critical',
        name='notification_priority', create_type=True
    )
    notification_priority.create(op.get_bind())
    
    audit_status = postgresql.ENUM(
        'success', 'failure',
        name='audit_status', create_type=True
    )
    audit_status.create(op.get_bind())

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('username', sa.String(50), unique=True, nullable=True, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=True),
        sa.Column('last_name', sa.String(100), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('status', user_status, default='pending_verification', nullable=False, index=True),
        sa.Column('email_verified', sa.Boolean, default=False, nullable=False),
        sa.Column('locale', sa.String(10), default='en', nullable=False),
        sa.Column('timezone', sa.String(50), default='UTC', nullable=False),
        sa.Column('metadata', postgresql.JSONB, default={}, nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    
    # Create roles table
    op.create_table(
        'roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('priority', sa.Integer, default=0, nullable=False),
        sa.Column('is_system', sa.Boolean, default=False, nullable=False),
        sa.Column('parent_role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('roles.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # Create permissions table
    op.create_table(
        'permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('resource', sa.String(100), nullable=False, index=True),
        sa.Column('action', permission_action, nullable=False),
        sa.Column('scope', permission_scope, default='global', nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('resource', 'action', 'scope', name='uq_permission_resource_action_scope'),
    )
    
    # Create role_permissions table
    op.create_table(
        'role_permissions',
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('permission_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('granted_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('granted_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    
    # Create user_roles table
    op.create_table(
        'user_roles',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('assigned_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    
    # Create sessions table
    op.create_table(
        'sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('token_hash', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('refresh_token_hash', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('device_id', sa.String(100), nullable=True, index=True),
        sa.Column('device_type', device_type, default='web', nullable=False),
        sa.Column('device_name', sa.String(100), nullable=True),
        sa.Column('os', sa.String(50), nullable=True),
        sa.Column('browser', sa.String(50), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True, index=True),
        sa.Column('location_city', sa.String(100), nullable=True),
        sa.Column('location_country', sa.String(100), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('last_activity', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('revoked', sa.Boolean, default=False, nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revoked_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    
    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('type', notification_type, default='personal', nullable=False),
        sa.Column('priority', notification_priority, default='normal', nullable=False),
        sa.Column('read', sa.Boolean, default=False, nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('action_url', sa.String(500), nullable=True),
        sa.Column('metadata', postgresql.JSONB, default={}, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('event_type', sa.String(100), nullable=False, index=True),
        sa.Column('actor_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('actor_session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sessions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('target_resource_type', sa.String(50), nullable=True, index=True),
        sa.Column('target_resource_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(50), nullable=False, index=True),
        sa.Column('status', audit_status, default='success', nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('device_info', postgresql.JSONB, default={}, nullable=False),
        sa.Column('metadata', postgresql.JSONB, default={}, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
    )
    
    # Create indexes
    op.create_index('ix_audit_logs_actor_created', 'audit_logs', ['actor_user_id', 'created_at'])
    op.create_index('ix_audit_logs_event_created', 'audit_logs', ['event_type', 'created_at'])
    op.create_index('ix_audit_logs_target', 'audit_logs', ['target_resource_type', 'target_resource_id'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('audit_logs')
    op.drop_table('notifications')
    op.drop_table('sessions')
    op.drop_table('user_roles')
    op.drop_table('role_permissions')
    op.drop_table('permissions')
    op.drop_table('roles')
    op.drop_table('users')
    
    # Drop enum types
    op.execute('DROP TYPE IF EXISTS audit_status')
    op.execute('DROP TYPE IF EXISTS notification_priority')
    op.execute('DROP TYPE IF EXISTS notification_type')
    op.execute('DROP TYPE IF EXISTS permission_scope')
    op.execute('DROP TYPE IF EXISTS permission_action')
    op.execute('DROP TYPE IF EXISTS device_type')
    op.execute('DROP TYPE IF EXISTS user_status')
