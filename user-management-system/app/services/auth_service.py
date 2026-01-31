"""Authentication service."""

from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.core.exceptions import (
    AuthenticationError,
    BadRequestError,
    ConflictError,
    NotFoundError,
    UserInactiveError,
)
from app.models.user import User
from app.models.session import Session
from app.models.enums import UserStatus, DeviceType
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    LoginResponse,
)
from app.schemas.user import UserResponse


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def register(
        self,
        data: RegisterRequest,
        ip_address: Optional[str] = None,
    ) -> User:
        """
        Register a new user.
        
        Args:
            data: Registration data
            ip_address: Client IP address
            
        Returns:
            Created user
            
        Raises:
            ConflictError: If email already exists
        """
        # Check if email already exists
        result = await self.db.execute(
            select(User).where(User.email == data.email.lower())
        )
        if result.scalar_one_or_none():
            raise ConflictError("Email already registered")
        
        # Check if username already exists
        if data.username:
            result = await self.db.execute(
                select(User).where(User.username == data.username.lower())
            )
            if result.scalar_one_or_none():
                raise ConflictError("Username already taken")
        
        # Create user
        user = User(
            email=data.email.lower(),
            username=data.username.lower() if data.username else None,
            password_hash=get_password_hash(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            status=UserStatus.PENDING_VERIFICATION,
            email_verified=False,
        )
        
        self.db.add(user)
        await self.db.flush()
        
        return user
    
    async def login(
        self,
        data: LoginRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[User, TokenResponse, Session]:
        """
        Authenticate user and create session.
        
        Args:
            data: Login credentials
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            Tuple of (user, tokens, session)
            
        Raises:
            AuthenticationError: If credentials are invalid
        """
        # Get user by email
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.roles))
            .where(User.email == data.email.lower())
            .where(User.deleted_at.is_(None))
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise AuthenticationError("Invalid email or password")
        
        # Verify password
        if not verify_password(data.password, user.password_hash):
            raise AuthenticationError("Invalid email or password")
        
        # Check user status
        if user.status == UserStatus.LOCKED:
            raise AuthenticationError("Account is locked")
        
        if user.status == UserStatus.SUSPENDED:
            raise AuthenticationError("Account is suspended")
        
        if user.status == UserStatus.INACTIVE:
            raise UserInactiveError()
        
        # Create tokens
        tokens, session = await self._create_session(
            user=user,
            device_id=data.device_id,
            device_name=data.device_name,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        
        return user, tokens, session
    
    async def _create_session(
        self,
        user: User,
        device_id: Optional[str] = None,
        device_name: Optional[str] = None,
        device_type: DeviceType = DeviceType.WEB,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[TokenResponse, Session]:
        """Create user session and tokens."""
        session_id = uuid.uuid4()
        
        # Create access token
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "session_id": str(session_id),
                "email": user.email,
            }
        )
        
        # Create refresh token
        refresh_token = create_refresh_token(
            data={
                "sub": str(user.id),
                "session_id": str(session_id),
            }
        )
        
        # Calculate expiration
        access_expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        refresh_expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        
        # Create session record
        session = Session(
            id=session_id,
            user_id=user.id,
            token_hash=hash_token(access_token),
            refresh_token_hash=hash_token(refresh_token),
            device_id=device_id,
            device_type=device_type,
            device_name=device_name,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=refresh_expires_at,
        )
        
        self.db.add(session)
        await self.db.flush()
        
        tokens = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            expires_at=access_expires_at,
        )
        
        return tokens, session
    
    async def refresh_token(
        self,
        refresh_token: str,
        ip_address: Optional[str] = None,
    ) -> TokenResponse:
        """
        Refresh access token.
        
        Args:
            refresh_token: Refresh token
            ip_address: Client IP address
            
        Returns:
            New token response
            
        Raises:
            AuthenticationError: If token is invalid
        """
        # Decode refresh token
        payload = decode_token(refresh_token)
        if not payload:
            raise AuthenticationError("Invalid refresh token")
        
        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")
        
        # Get session
        session_id = payload.get("session_id")
        if not session_id:
            raise AuthenticationError("Invalid token")
        
        result = await self.db.execute(
            select(Session)
            .where(Session.id == uuid.UUID(session_id))
            .where(Session.revoked == False)
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise AuthenticationError("Session not found or revoked")
        
        if not session.is_active:
            raise AuthenticationError("Session expired")
        
        # Verify token hash
        if session.refresh_token_hash != hash_token(refresh_token):
            raise AuthenticationError("Invalid refresh token")
        
        # Get user
        result = await self.db.execute(
            select(User)
            .where(User.id == session.user_id)
            .where(User.deleted_at.is_(None))
        )
        user = result.scalar_one_or_none()
        
        if not user or user.status != UserStatus.ACTIVE:
            raise AuthenticationError("User not found or inactive")
        
        # Create new access token
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "session_id": str(session.id),
                "email": user.email,
            }
        )
        
        access_expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        
        # Update session
        session.token_hash = hash_token(access_token)
        session.update_activity()
        if ip_address:
            session.ip_address = ip_address
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            expires_at=access_expires_at,
        )
    
    async def logout(
        self,
        user: User,
        session_id: Optional[uuid.UUID] = None,
        all_devices: bool = False,
    ) -> int:
        """
        Logout user (revoke sessions).
        
        Args:
            user: Current user
            session_id: Specific session to revoke
            all_devices: Revoke all user sessions
            
        Returns:
            Number of sessions revoked
        """
        if all_devices:
            # Revoke all user sessions
            result = await self.db.execute(
                select(Session)
                .where(Session.user_id == user.id)
                .where(Session.revoked == False)
            )
            sessions = result.scalars().all()
            
            for session in sessions:
                session.revoke(user.id)
            
            return len(sessions)
        
        if session_id:
            # Revoke specific session
            result = await self.db.execute(
                select(Session)
                .where(Session.id == session_id)
                .where(Session.user_id == user.id)
                .where(Session.revoked == False)
            )
            session = result.scalar_one_or_none()
            
            if session:
                session.revoke(user.id)
                return 1
        
        return 0
    
    async def verify_email(self, token: str) -> User:
        """
        Verify user email.
        
        Args:
            token: Verification token
            
        Returns:
            Updated user
            
        Raises:
            BadRequestError: If token is invalid
        """
        from app.core.security import verify_verification_token
        
        user_id = verify_verification_token(token, "email_verification")
        if not user_id:
            raise BadRequestError("Invalid or expired verification token")
        
        result = await self.db.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise NotFoundError("User")
        
        user.email_verified = True
        user.status = UserStatus.ACTIVE
        
        return user
