#!/usr/bin/env python3
"""Full database seeding script with comprehensive test data."""

import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone
from typing import List

import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Database configuration
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/userdb"


def get_password_hash(password: str) -> str:
    """Generate bcrypt password hash."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def generate_uuid() -> uuid.UUID:
    """Generate a new UUID."""
    return uuid.uuid4()


# Test data
SAMPLE_USERS = [
    {
        "email": "admin@example.com",
        "username": "admin",
        "password": "admin123",
        "first_name": "System",
        "last_name": "Administrator",
        "phone": "+7 (999) 111-22-33",
        "status": "active",
        "email_verified": True,
        "locale": "ru",
        "timezone": "Europe/Moscow",
        "role": "admin",
    },
    {
        "email": "moderator@example.com",
        "username": "moderator",
        "password": "mod123",
        "first_name": "Мария",
        "last_name": "Иванова",
        "phone": "+7 (999) 222-33-44",
        "status": "active",
        "email_verified": True,
        "locale": "ru",
        "timezone": "Europe/Moscow",
        "role": "moderator",
    },
    {
        "email": "john.doe@example.com",
        "username": "johndoe",
        "password": "password123",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1 (555) 123-4567",
        "status": "active",
        "email_verified": True,
        "locale": "en",
        "timezone": "America/New_York",
        "role": "user",
    },
    {
        "email": "anna.smith@example.com",
        "username": "annasmith",
        "password": "password123",
        "first_name": "Anna",
        "last_name": "Smith",
        "phone": "+1 (555) 234-5678",
        "status": "active",
        "email_verified": True,
        "locale": "en",
        "timezone": "America/Los_Angeles",
        "role": "user",
    },
    {
        "email": "ivan.petrov@example.com",
        "username": "ivanpetrov",
        "password": "password123",
        "first_name": "Иван",
        "last_name": "Петров",
        "phone": "+7 (999) 333-44-55",
        "status": "active",
        "email_verified": True,
        "locale": "ru",
        "timezone": "Europe/Moscow",
        "role": "user",
    },
    {
        "email": "olga.sidorova@example.com",
        "username": "olgasidorova",
        "password": "password123",
        "first_name": "Ольга",
        "last_name": "Сидорова",
        "phone": "+7 (999) 444-55-66",
        "status": "active",
        "email_verified": True,
        "locale": "ru",
        "timezone": "Europe/Moscow",
        "role": "user",
    },
    {
        "email": "pending.user@example.com",
        "username": "pendinguser",
        "password": "password123",
        "first_name": "Pending",
        "last_name": "User",
        "phone": None,
        "status": "pending_verification",
        "email_verified": False,
        "locale": "en",
        "timezone": "UTC",
        "role": "user",
    },
    {
        "email": "inactive.user@example.com",
        "username": "inactiveuser",
        "password": "password123",
        "first_name": "Inactive",
        "last_name": "User",
        "phone": None,
        "status": "inactive",
        "email_verified": True,
        "locale": "en",
        "timezone": "UTC",
        "role": "user",
    },
    {
        "email": "locked.user@example.com",
        "username": "lockeduser",
        "password": "password123",
        "first_name": "Locked",
        "last_name": "User",
        "phone": None,
        "status": "locked",
        "email_verified": True,
        "locale": "en",
        "timezone": "UTC",
        "role": "user",
    },
    {
        "email": "alex.johnson@example.com",
        "username": "alexjohnson",
        "password": "password123",
        "first_name": "Alex",
        "last_name": "Johnson",
        "phone": "+1 (555) 345-6789",
        "status": "active",
        "email_verified": True,
        "locale": "en",
        "timezone": "Europe/London",
        "role": "user",
    },
]

PERMISSIONS_DATA = [
    # Users
    ("users", "create", "global", "Create users"),
    ("users", "read", "global", "Read all users"),
    ("users", "read", "own", "Read own user"),
    ("users", "update", "global", "Update all users"),
    ("users", "update", "own", "Update own user"),
    ("users", "delete", "global", "Delete users"),
    ("users", "manage", "global", "Manage users (assign roles)"),
    # Roles
    ("roles", "create", "global", "Create roles"),
    ("roles", "read", "global", "Read roles"),
    ("roles", "update", "global", "Update roles"),
    ("roles", "delete", "global", "Delete roles"),
    # Permissions
    ("permissions", "read", "global", "Read permissions"),
    # Sessions
    ("sessions", "read", "global", "Read all sessions"),
    ("sessions", "read", "own", "Read own sessions"),
    ("sessions", "delete", "global", "Revoke any session"),
    ("sessions", "delete", "own", "Revoke own sessions"),
    # Audit
    ("audit", "read", "global", "Read audit logs"),
    # Notifications
    ("notifications", "read", "global", "Read all notifications"),
    ("notifications", "read", "own", "Read own notifications"),
    ("notifications", "create", "global", "Create notifications"),
    ("notifications", "delete", "own", "Delete own notifications"),
    # Admin
    ("admin", "manage", "global", "Full admin access"),
    # Dashboard
    ("dashboard", "read", "global", "View admin dashboard"),
    # Reports
    ("reports", "read", "global", "View system reports"),
    ("reports", "create", "global", "Generate reports"),
]

NOTIFICATION_TEMPLATES = [
    {
        "title": "Добро пожаловать!",
        "message": "Благодарим за регистрацию в нашей системе. Ваш аккаунт успешно создан.",
        "type": "system",
        "priority": "normal",
    },
    {
        "title": "Welcome!",
        "message": "Thank you for registering with our system. Your account has been successfully created.",
        "type": "system",
        "priority": "normal",
    },
    {
        "title": "Новый вход в систему",
        "message": "Обнаружен вход с нового устройства. Если это были не вы, пожалуйста, смените пароль.",
        "type": "security",
        "priority": "high",
    },
    {
        "title": "Обновление профиля",
        "message": "Ваш профиль был успешно обновлен.",
        "type": "personal",
        "priority": "low",
    },
    {
        "title": "Техническое обслуживание",
        "message": "Плановое техническое обслуживание запланировано на выходные.",
        "type": "broadcast",
        "priority": "normal",
    },
]

AUDIT_EVENTS = [
    ("user.login", "auth", "success"),
    ("user.logout", "auth", "success"),
    ("user.register", "auth", "success"),
    ("user.password_change", "auth", "success"),
    ("user.profile_update", "user", "success"),
    ("user.email_verify", "auth", "success"),
    ("session.create", "session", "success"),
    ("session.revoke", "session", "success"),
    ("admin.user_view", "admin", "success"),
    ("admin.role_assign", "admin", "success"),
]


async def seed_database():
    """Main function to seed the database."""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Check if data already exists
            result = await session.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            if count > 0:
                print(f"Database already has {count} users. Skipping seed.")
                print("To reseed, drop all tables first.")
                return
            
            # =====================
            # Create Permissions
            # =====================
            print("Creating permissions...")
            permission_ids = {}
            for resource, action, scope, description in PERMISSIONS_DATA:
                perm_id = generate_uuid()
                permission_ids[f"{resource}:{action}:{scope}"] = perm_id
                await session.execute(text("""
                    INSERT INTO permissions (id, resource, action, scope, description, created_at)
                    VALUES (:id, :resource, :action, :scope, :description, :created_at)
                """), {
                    "id": perm_id,
                    "resource": resource,
                    "action": action,
                    "scope": scope,
                    "description": description,
                    "created_at": datetime.now(timezone.utc),
                })
            print(f"  Created {len(permission_ids)} permissions")
            
            # =====================
            # Create Roles
            # =====================
            print("Creating roles...")
            roles = {
                "admin": {
                    "id": generate_uuid(),
                    "name": "admin",
                    "description": "Full system administrator with all permissions",
                    "priority": 100,
                    "is_system": True,
                },
                "moderator": {
                    "id": generate_uuid(),
                    "name": "moderator",
                    "description": "User moderator with limited admin access",
                    "priority": 50,
                    "is_system": True,
                },
                "user": {
                    "id": generate_uuid(),
                    "name": "user",
                    "description": "Regular user with basic permissions",
                    "priority": 10,
                    "is_system": True,
                },
                "guest": {
                    "id": generate_uuid(),
                    "name": "guest",
                    "description": "Guest user with read-only access",
                    "priority": 1,
                    "is_system": True,
                },
            }
            
            for role in roles.values():
                await session.execute(text("""
                    INSERT INTO roles (id, name, description, priority, is_system, created_at, updated_at)
                    VALUES (:id, :name, :description, :priority, :is_system, :created_at, :updated_at)
                """), {
                    **role,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                })
            print(f"  Created {len(roles)} roles")
            
            # =====================
            # Assign Permissions to Roles
            # =====================
            print("Assigning permissions to roles...")
            
            # Admin gets all permissions
            for perm_key, perm_id in permission_ids.items():
                await session.execute(text("""
                    INSERT INTO role_permissions (role_id, permission_id, granted_at)
                    VALUES (:role_id, :permission_id, :granted_at)
                """), {
                    "role_id": roles["admin"]["id"],
                    "permission_id": perm_id,
                    "granted_at": datetime.now(timezone.utc),
                })
            
            # Moderator permissions
            mod_perms = [
                "users:read:global", "users:update:global",
                "sessions:read:global", "sessions:delete:global",
                "notifications:read:global", "notifications:create:global",
                "audit:read:global", "dashboard:read:global",
            ]
            for perm_key in mod_perms:
                if perm_key in permission_ids:
                    await session.execute(text("""
                        INSERT INTO role_permissions (role_id, permission_id, granted_at)
                        VALUES (:role_id, :permission_id, :granted_at)
                    """), {
                        "role_id": roles["moderator"]["id"],
                        "permission_id": permission_ids[perm_key],
                        "granted_at": datetime.now(timezone.utc),
                    })
            
            # User permissions
            user_perms = [
                "users:read:own", "users:update:own",
                "sessions:read:own", "sessions:delete:own",
                "notifications:read:own", "notifications:delete:own",
            ]
            for perm_key in user_perms:
                if perm_key in permission_ids:
                    await session.execute(text("""
                        INSERT INTO role_permissions (role_id, permission_id, granted_at)
                        VALUES (:role_id, :permission_id, :granted_at)
                    """), {
                        "role_id": roles["user"]["id"],
                        "permission_id": permission_ids[perm_key],
                        "granted_at": datetime.now(timezone.utc),
                    })
            
            print("  Permissions assigned successfully")
            
            # =====================
            # Create Users
            # =====================
            print("Creating users...")
            user_ids = {}
            for user_data in SAMPLE_USERS:
                user_id = generate_uuid()
                user_ids[user_data["username"]] = user_id
                
                created_at = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 90))
                last_login = created_at + timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
                
                await session.execute(text("""
                    INSERT INTO users (
                        id, email, username, password_hash, first_name, last_name,
                        phone, status, email_verified, locale, timezone,
                        metadata, last_login_at, created_at, updated_at
                    )
                    VALUES (
                        :id, :email, :username, :password_hash, :first_name, :last_name,
                        :phone, :status, :email_verified, :locale, :timezone,
                        :metadata, :last_login_at, :created_at, :updated_at
                    )
                """), {
                    "id": user_id,
                    "email": user_data["email"],
                    "username": user_data["username"],
                    "password_hash": get_password_hash(user_data["password"]),
                    "first_name": user_data["first_name"],
                    "last_name": user_data["last_name"],
                    "phone": user_data["phone"],
                    "status": user_data["status"],
                    "email_verified": user_data["email_verified"],
                    "locale": user_data["locale"],
                    "timezone": user_data["timezone"],
                    "metadata": "{}",
                    "last_login_at": last_login if user_data["status"] == "active" else None,
                    "created_at": created_at,
                    "updated_at": datetime.now(timezone.utc),
                })
                
                # Assign role
                role_name = user_data.get("role", "user")
                await session.execute(text("""
                    INSERT INTO user_roles (user_id, role_id, assigned_at)
                    VALUES (:user_id, :role_id, :assigned_at)
                """), {
                    "user_id": user_id,
                    "role_id": roles[role_name]["id"],
                    "assigned_at": created_at,
                })
            
            print(f"  Created {len(user_ids)} users")
            
            # =====================
            # Create Sessions (for active users)
            # =====================
            print("Creating sessions...")
            session_count = 0
            active_users = [u for u in SAMPLE_USERS if u["status"] == "active"]
            
            for user_data in active_users[:5]:  # Only first 5 active users
                user_id = user_ids[user_data["username"]]
                session_id = generate_uuid()
                
                created_at = datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48))
                expires_at = created_at + timedelta(days=7)
                
                await session.execute(text("""
                    INSERT INTO sessions (
                        id, user_id, token_hash, refresh_token_hash,
                        device_id, device_type, device_name, os, browser,
                        ip_address, location_city, location_country,
                        user_agent, last_activity, created_at, expires_at, revoked
                    )
                    VALUES (
                        :id, :user_id, :token_hash, :refresh_token_hash,
                        :device_id, :device_type, :device_name, :os, :browser,
                        :ip_address, :location_city, :location_country,
                        :user_agent, :last_activity, :created_at, :expires_at, :revoked
                    )
                """), {
                    "id": session_id,
                    "user_id": user_id,
                    "token_hash": f"token_{uuid.uuid4().hex}",
                    "refresh_token_hash": f"refresh_{uuid.uuid4().hex}",
                    "device_id": f"device_{uuid.uuid4().hex[:8]}",
                    "device_type": random.choice(["web", "mobile", "desktop"]),
                    "device_name": random.choice(["Chrome on Windows", "Safari on MacOS", "Firefox on Linux", "Mobile App"]),
                    "os": random.choice(["Windows 11", "MacOS Sonoma", "Ubuntu 22.04", "iOS 17", "Android 14"]),
                    "browser": random.choice(["Chrome 120", "Safari 17", "Firefox 121", None]),
                    "ip_address": f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                    "location_city": random.choice(["Moscow", "New York", "London", "Berlin", "Tokyo"]),
                    "location_country": random.choice(["Russia", "USA", "UK", "Germany", "Japan"]),
                    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "last_activity": datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 120)),
                    "created_at": created_at,
                    "expires_at": expires_at,
                    "revoked": False,
                })
                session_count += 1
            
            print(f"  Created {session_count} sessions")
            
            # =====================
            # Create Notifications
            # =====================
            print("Creating notifications...")
            notification_count = 0
            
            for user_data in SAMPLE_USERS:
                user_id = user_ids[user_data["username"]]
                
                # Each user gets 2-4 notifications
                num_notifications = random.randint(2, 4)
                selected_templates = random.sample(NOTIFICATION_TEMPLATES, min(num_notifications, len(NOTIFICATION_TEMPLATES)))
                
                for template in selected_templates:
                    notification_id = generate_uuid()
                    created_at = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
                    is_read = random.choice([True, False])
                    
                    await session.execute(text("""
                        INSERT INTO notifications (
                            id, user_id, title, message, type, priority,
                            read, read_at, action_url, metadata, created_at
                        )
                        VALUES (
                            :id, :user_id, :title, :message, :type, :priority,
                            :read, :read_at, :action_url, :metadata, :created_at
                        )
                    """), {
                        "id": notification_id,
                        "user_id": user_id,
                        "title": template["title"],
                        "message": template["message"],
                        "type": template["type"],
                        "priority": template["priority"],
                        "read": is_read,
                        "read_at": created_at + timedelta(hours=random.randint(1, 24)) if is_read else None,
                        "action_url": None,
                        "metadata": "{}",
                        "created_at": created_at,
                    })
                    notification_count += 1
            
            print(f"  Created {notification_count} notifications")
            
            # =====================
            # Create Audit Logs
            # =====================
            print("Creating audit logs...")
            audit_count = 0
            
            for user_data in active_users:
                user_id = user_ids[user_data["username"]]
                
                # Each active user gets 5-10 audit events
                num_events = random.randint(5, 10)
                
                for _ in range(num_events):
                    event = random.choice(AUDIT_EVENTS)
                    audit_id = generate_uuid()
                    created_at = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 60), hours=random.randint(0, 23))
                    
                    await session.execute(text("""
                        INSERT INTO audit_logs (
                            id, event_type, actor_user_id, target_resource_type,
                            target_resource_id, action, status, ip_address,
                            device_info, metadata, created_at
                        )
                        VALUES (
                            :id, :event_type, :actor_user_id, :target_resource_type,
                            :target_resource_id, :action, :status, :ip_address,
                            :device_info, :metadata, :created_at
                        )
                    """), {
                        "id": audit_id,
                        "event_type": event[0],
                        "actor_user_id": user_id,
                        "target_resource_type": event[1],
                        "target_resource_id": user_id if event[1] == "user" else None,
                        "action": event[0].split(".")[-1],
                        "status": event[2],
                        "ip_address": f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                        "device_info": '{"browser": "Chrome", "os": "Windows"}',
                        "metadata": "{}",
                        "created_at": created_at,
                    })
                    audit_count += 1
            
            print(f"  Created {audit_count} audit log entries")
            
            # Commit all changes
            await session.commit()
            
            print("\n" + "="*60)
            print("DATABASE SEEDING COMPLETED SUCCESSFULLY!")
            print("="*60)
            print("\nTest Accounts:")
            print("-"*60)
            print(f"{'Email':<35} {'Password':<15} {'Role':<10}")
            print("-"*60)
            for user in SAMPLE_USERS[:5]:
                print(f"{user['email']:<35} {user['password']:<15} {user['role']:<10}")
            print("-"*60)
            print(f"\nTotal: {len(SAMPLE_USERS)} users, {len(roles)} roles, {len(permission_ids)} permissions")
            print(f"       {session_count} sessions, {notification_count} notifications, {audit_count} audit logs")
            
        except Exception as e:
            await session.rollback()
            print(f"\nERROR: {e}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
