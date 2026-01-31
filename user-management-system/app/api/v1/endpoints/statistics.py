"""Statistics API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.user import User
from app.services.statistics_service import StatisticsService
from app.schemas.statistics import DashboardStatistics


router = APIRouter(prefix="/statistics", tags=["Statistics"])


@router.get(
    "/dashboard",
    response_model=DashboardStatistics,
    summary="Get dashboard statistics",
)
async def get_dashboard_statistics(
    current_user: User = Depends(require_permission("users", "read")),
    db: AsyncSession = Depends(get_db),
):
    """
    Get dashboard statistics for admin panel.
    
    Includes:
    - Total user counts
    - User status breakdown
    - Registration trends
    - Activity charts data
    - Recent registrations
    
    Requires `users:read` permission.
    """
    service = StatisticsService(db)
    return await service.get_dashboard_statistics()
