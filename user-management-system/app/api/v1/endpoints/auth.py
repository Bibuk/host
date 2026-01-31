"""Authentication API endpoints."""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    get_client_ip,
    get_user_agent,
)
from app.core.security import generate_verification_token
from app.models.user import User
from app.services.auth_service import AuthService
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    TokenRefreshRequest,
    TokenResponse,
    LogoutRequest,
    VerifyEmailRequest,
)
from app.schemas.user import UserResponse
from app.schemas.base import MessageResponse
# from app.tasks.email_tasks import send_verification_email


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
)
async def register(
    request: Request,
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user account.
    
    - Validates email uniqueness
    - Validates password strength
    - Creates user with pending verification status
    - Sends verification email (async task)
    """
    auth_service = AuthService(db)
    ip_address = get_client_ip(request)
    
    user = await auth_service.register(data, ip_address)
    
    # Send verification email via Celery task
    # verification_token = generate_verification_token(str(user.id), "email_verification")
    # send_verification_email.delay(user.email, verification_token)
    
    return user


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login user",
)
async def login(
    request: Request,
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user and return tokens.
    
    - Validates credentials
    - Creates new session
    - Returns access and refresh tokens
    """
    auth_service = AuthService(db)
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    user, tokens, session = await auth_service.login(
        data,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return LoginResponse(
        user=UserResponse.model_validate(user),
        tokens=tokens,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh_token(
    request: Request,
    data: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access token using refresh token.
    
    - Validates refresh token
    - Creates new access token
    - Updates session activity
    """
    auth_service = AuthService(db)
    ip_address = get_client_ip(request)
    
    tokens = await auth_service.refresh_token(
        data.refresh_token,
        ip_address=ip_address,
    )
    
    return tokens


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout user",
)
async def logout(
    data: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Logout user and revoke session(s).
    
    - Revokes current session by default
    - Can revoke all sessions with all_devices=true
    - Can revoke specific session with session_id
    """
    auth_service = AuthService(db)
    
    count = await auth_service.logout(
        user=current_user,
        session_id=data.session_id,
        all_devices=data.all_devices,
    )
    
    if data.all_devices:
        return MessageResponse(message=f"Logged out from {count} devices")
    return MessageResponse(message="Logged out successfully")


@router.post(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify email address",
)
async def verify_email(
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify user email address.
    
    - Validates verification token
    - Updates user status to active
    """
    auth_service = AuthService(db)
    await auth_service.verify_email(data.token)
    
    return MessageResponse(message="Email verified successfully")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Get current authenticated user profile.
    """
    return current_user
