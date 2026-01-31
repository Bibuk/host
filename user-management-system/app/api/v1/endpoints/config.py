"""Configuration API endpoints for desktop and external clients."""

from typing import Optional
from fastapi import APIRouter, Request
from pydantic import BaseModel


router = APIRouter(prefix="/config", tags=["Configuration"])


class ServerConfigResponse(BaseModel):
    """Server configuration for clients."""
    api_version: str = "v1"
    api_url: str
    server_name: str = "User Management System"
    server_version: str = "1.0.0"
    features: dict = {
        "notifications": True,
        "sessions": True,
        "audit_log": True,
        "email_verification": True
    }


class DesktopConfigResponse(BaseModel):
    """Configuration specifically for desktop application."""
    api_url: str
    websocket_url: Optional[str] = None
    update_url: Optional[str] = None
    min_version: str = "1.0.0"
    latest_version: str = "1.0.0"


@router.get("/server", response_model=ServerConfigResponse)
async def get_server_config(request: Request):
    """
    Get server configuration.
    
    This endpoint allows clients to discover server capabilities
    and get the correct API URL.
    """
    # Determine the base URL from the request
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host", request.headers.get("host", "localhost:8000"))
    base_url = f"{scheme}://{host}"
    
    return ServerConfigResponse(
        api_url=f"{base_url}/api/v1",
    )


@router.get("/desktop", response_model=DesktopConfigResponse)
async def get_desktop_config(request: Request):
    """
    Get configuration for desktop application.
    
    Desktop app can call this endpoint to get the correct API URL
    and check for updates.
    """
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host", request.headers.get("host", "localhost:8000"))
    base_url = f"{scheme}://{host}"
    
    return DesktopConfigResponse(
        api_url=f"{base_url}/api/v1",
        websocket_url=f"ws://{host}/ws",
    )


@router.get("/ping")
async def ping():
    """
    Simple ping endpoint to check server availability.
    
    Returns a simple response for connection testing.
    """
    return {"status": "ok", "message": "pong"}
