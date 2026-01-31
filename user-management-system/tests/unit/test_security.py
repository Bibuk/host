"""Tests for security utilities."""

import pytest

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    hash_token,
    verify_password,
)


class TestPasswordHashing:
    """Tests for password hashing."""
    
    def test_hash_password(self):
        """Test password hashing."""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > 0
    
    def test_verify_password_success(self):
        """Test successful password verification."""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_password_failure(self):
        """Test failed password verification."""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert verify_password("WrongPassword", hashed) is False


class TestJWT:
    """Tests for JWT token handling."""
    
    def test_create_access_token(self):
        """Test access token creation."""
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_refresh_token(self):
        """Test refresh token creation."""
        data = {"sub": "user123"}
        token = create_refresh_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_decode_access_token(self):
        """Test access token decoding."""
        data = {"sub": "user123", "email": "test@example.com"}
        token = create_access_token(data)
        
        decoded = decode_token(token)
        
        assert decoded is not None
        assert decoded["sub"] == "user123"
        assert decoded["email"] == "test@example.com"
        assert decoded["type"] == "access"
    
    def test_decode_refresh_token(self):
        """Test refresh token decoding."""
        data = {"sub": "user123"}
        token = create_refresh_token(data)
        
        decoded = decode_token(token)
        
        assert decoded is not None
        assert decoded["sub"] == "user123"
        assert decoded["type"] == "refresh"
    
    def test_decode_invalid_token(self):
        """Test decoding invalid token."""
        decoded = decode_token("invalid.token.here")
        
        assert decoded is None


class TestTokenHashing:
    """Tests for token hashing."""
    
    def test_hash_token(self):
        """Test token hashing."""
        token = "my_secret_token"
        hashed = hash_token(token)
        
        assert isinstance(hashed, str)
        assert len(hashed) == 64  # SHA-256 hex length
        assert hashed != token
    
    def test_hash_token_deterministic(self):
        """Test that same token produces same hash."""
        token = "my_secret_token"
        hash1 = hash_token(token)
        hash2 = hash_token(token)
        
        assert hash1 == hash2
