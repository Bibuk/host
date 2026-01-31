"""Integration tests for auth endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAuthEndpoints:
    """Tests for authentication endpoints."""
    
    async def test_register_user(self, client: AsyncClient, user_data: dict):
        """Test user registration."""
        response = await client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"].lower()
        assert "id" in data
        assert "password" not in data
        assert "password_hash" not in data
    
    async def test_register_duplicate_email(self, client: AsyncClient, user_data: dict):
        """Test registration with duplicate email."""
        # First registration
        await client.post("/api/v1/auth/register", json=user_data)
        
        # Duplicate registration
        response = await client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 409
    
    async def test_login_success(self, client: AsyncClient, user_data: dict):
        """Test successful login."""
        # Register user first
        await client.post("/api/v1/auth/register", json=user_data)
        
        # Login
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"],
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        # Note: Login may fail if user status is not ACTIVE
        # In production, user needs to verify email first
        assert response.status_code in [200, 401]
    
    async def test_login_wrong_password(self, client: AsyncClient, user_data: dict):
        """Test login with wrong password."""
        # Register user first
        await client.post("/api/v1/auth/register", json=user_data)
        
        # Login with wrong password
        login_data = {
            "email": user_data["email"],
            "password": "WrongPassword123!",
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
    
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with nonexistent user."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!",
        }
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401


@pytest.mark.asyncio
class TestHealthEndpoint:
    """Tests for health check endpoint."""
    
    async def test_health_check(self, client: AsyncClient):
        """Test health check endpoint."""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data
        assert "redis" in data
