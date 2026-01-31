#!/usr/bin/env python3
"""Database seeding script."""

import asyncio
import uuid
import bcrypt

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models.user import User
from app.models.role import Role, Permission, RolePermission, UserRole
from app.models.enums import UserStatus, PermissionAction, PermissionScope


def get_password_hash_simple(password: str) -> str:
    """Simple bcrypt hash."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


async def seed_permissions(session: AsyncSession) -> dict[str, Permission]:
    """Seed default permissions."""
    permissions_data = [
        # Users
        ("users", PermissionAction.CREATE, PermissionScope.GLOBAL, "Create users"),
        ("users", PermissionAction.READ, PermissionScope.GLOBAL, "Read all users"),
        ("users", PermissionAction.READ, PermissionScope.OWN, "Read own user"),
        ("users", PermissionAction.UPDATE, PermissionScope.GLOBAL, "Update all users"),
        ("users", PermissionAction.UPDATE, PermissionScope.OWN, "Update own user"),
        ("users", PermissionAction.DELETE, PermissionScope.GLOBAL, "Delete users"),
        ("users", PermissionAction.MANAGE, PermissionScope.GLOBAL, "Manage users (assign roles)"),
        # Roles
        ("roles", PermissionAction.CREATE, PermissionScope.GLOBAL, "Create roles"),
        ("roles", PermissionAction.READ, PermissionScope.GLOBAL, "Read roles"),
        ("roles", PermissionAction.UPDATE, PermissionScope.GLOBAL, "Update roles"),
        ("roles", PermissionAction.DELETE, PermissionScope.GLOBAL, "Delete roles"),
        # Permissions
        ("permissions", PermissionAction.READ, PermissionScope.GLOBAL, "Read permissions"),
        # Sessions
        ("sessions", PermissionAction.READ, PermissionScope.GLOBAL, "Read all sessions"),
        ("sessions", PermissionAction.READ, PermissionScope.OWN, "Read own sessions"),
        ("sessions", PermissionAction.DELETE, PermissionScope.GLOBAL, "Revoke any session"),
        ("sessions", PermissionAction.DELETE, PermissionScope.OWN, "Revoke own sessions"),
        # Audit
        ("audit", PermissionAction.READ, PermissionScope.GLOBAL, "Read audit logs"),
        # Admin
        ("admin", PermissionAction.MANAGE, PermissionScope.GLOBAL, "Full admin access"),
    ]
    
    permissions = {}
    for resource, action, scope, description in permissions_data:
        perm = Permission(
            resource=resource,
            action=action,
            scope=scope,
            description=description,
        )
        session.add(perm)
        permissions[f"{resource}:{action.value}:{scope.value}"] = perm
    
    await session.flush()
    print(f"Created {len(permissions)} permissions")
    
    return permissions


async def seed_roles(
    session: AsyncSession,
    permissions: dict[str, Permission],
) -> dict[str, Role]:
    """Seed default roles."""
    roles = {}
    
    # Admin role - all permissions
    admin_role = Role(
        name="admin",
        description="Full system administrator",
        priority=100,
        is_system=True,
    )
    session.add(admin_role)
    roles["admin"] = admin_role
    
    # Moderator role
    moderator_role = Role(
        name="moderator",
        description="User moderator",
        priority=50,
        is_system=True,
    )
    session.add(moderator_role)
    roles["moderator"] = moderator_role
    
    # User role - basic permissions
    user_role = Role(
        name="user",
        description="Regular user",
        priority=10,
        is_system=True,
    )
    session.add(user_role)
    roles["user"] = user_role
    
    await session.flush()
    
    # Assign permissions to admin
    for perm in permissions.values():
        rp = RolePermission(
            role_id=admin_role.id,
            permission_id=perm.id,
        )
        session.add(rp)
    
    # Assign permissions to moderator
    mod_perms = [
        "users:read:global",
        "users:update:global",
        "sessions:read:global",
        "sessions:delete:global",
    ]
    for perm_key in mod_perms:
        if perm_key in permissions:
            rp = RolePermission(
                role_id=moderator_role.id,
                permission_id=permissions[perm_key].id,
            )
            session.add(rp)
    
    # Assign permissions to user
    user_perms = [
        "users:read:own",
        "users:update:own",
        "sessions:read:own",
        "sessions:delete:own",
    ]
    for perm_key in user_perms:
        if perm_key in permissions:
            rp = RolePermission(
                role_id=user_role.id,
                permission_id=permissions[perm_key].id,
            )
            session.add(rp)
    
    await session.flush()
    print(f"Created {len(roles)} roles")
    
    return roles


async def seed_admin_user(
    session: AsyncSession,
    roles: dict[str, Role],
) -> User:
    """Seed admin user."""
    admin = User(
        email="admin@example.com",
        username="admin",
        password_hash=get_password_hash_simple("admin123"),
        first_name="System",
        last_name="Administrator",
        status=UserStatus.ACTIVE,
        email_verified=True,
    )
    session.add(admin)
    await session.flush()
    
    # Assign admin role
    user_role = UserRole(
        user_id=admin.id,
        role_id=roles["admin"].id,
    )
    session.add(user_role)
    await session.flush()
    
    print(f"Created admin user: admin@example.com / admin123")
    
    return admin


async def main():
    """Main seeding function."""
    print("Starting database seeding...")
    
    async with async_session_factory() as session:
        try:
            permissions = await seed_permissions(session)
            roles = await seed_roles(session, permissions)
            admin = await seed_admin_user(session, roles)
            
            await session.commit()
            print("Database seeding completed successfully!")
            
        except Exception as e:
            await session.rollback()
            print(f"Error seeding database: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
