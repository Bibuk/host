"""Security utilities for JWT and password hashing."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import hashlib
import bcrypt

from jose import JWTError, jwt

from app.core.config import settings

logger = logging.getLogger(__name__)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hash."""
    try:
        password_bytes = plain_password.encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        logger.warning("Password verification failed due to an internal error")
        return False


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create JWT access token.
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    
    return encoded_jwt


def create_refresh_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create JWT refresh token.
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    
    return encoded_jwt


def decode_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and validate JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        return None


def hash_token(token: str) -> str:
    """
    Create SHA-256 hash of token for storage.
    
    Args:
        token: Plain token string
        
    Returns:
        Hexadecimal hash string
    """
    return hashlib.sha256(token.encode()).hexdigest()


def generate_verification_token(user_id: str, purpose: str = "email_verification") -> str:
    """
    Generate a verification token for email/password reset.
    
    Args:
        user_id: User ID
        purpose: Token purpose (email_verification, password_reset)
        
    Returns:
        JWT token
    """
    data = {
        "sub": user_id,
        "purpose": purpose,
    }
    
    expires_delta = timedelta(hours=24) if purpose == "email_verification" else timedelta(hours=1)
    
    return create_access_token(data, expires_delta=expires_delta)


def verify_verification_token(token: str, expected_purpose: str) -> Optional[str]:
    """
    Verify a verification token and return user ID.
    
    Args:
        token: JWT token
        expected_purpose: Expected token purpose
        
    Returns:
        User ID if valid, None otherwise
    """
    payload = decode_token(token)
    
    if not payload:
        return None
    
    if payload.get("purpose") != expected_purpose:
        return None
    
    return payload.get("sub")
