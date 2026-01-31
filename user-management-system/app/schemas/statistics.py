"""Statistics schemas."""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.schemas.base import BaseSchema


class UserStatusStats(BaseSchema):
    """User status statistics."""
    
    active: int = 0
    inactive: int = 0
    suspended: int = 0
    locked: int = 0
    pending_verification: int = 0


class DailyRegistrations(BaseSchema):
    """Daily registration stats."""
    
    date: str
    count: int


class DailyActivity(BaseSchema):
    """Daily activity stats."""
    
    date: str
    active_users: int
    new_registrations: int


class RecentUser(BaseSchema):
    """Recent user info for dashboard."""
    
    id: str
    email: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    status: str
    created_at: datetime


class DashboardStatistics(BaseSchema):
    """Main dashboard statistics response."""
    
    # Totals
    total_users: int = 0
    active_users: int = 0
    new_users_week: int = 0
    new_users_month: int = 0
    blocked_users: int = 0
    
    # Status breakdown
    status_stats: UserStatusStats
    
    # Trends
    weekly_trend: float = 0.0  # percentage change
    monthly_trend: float = 0.0  # percentage change
    
    # Charts data
    registrations_last_30_days: List[DailyRegistrations] = []
    activity_last_7_days: List[DailyActivity] = []
    
    # Recent users
    recent_users: List[RecentUser] = []
