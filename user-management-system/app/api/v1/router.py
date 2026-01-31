"""API v1 router."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, statistics, notifications, config

router = APIRouter()

# Include all endpoint routers
router.include_router(auth.router)
router.include_router(users.router)
router.include_router(statistics.router)
router.include_router(notifications.router)
router.include_router(config.router)
