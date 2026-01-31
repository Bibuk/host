"""Statistics service for dashboard data."""

from datetime import datetime, timedelta
from typing import List, Tuple
import uuid

from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.enums import UserStatus
from app.schemas.statistics import (
    DashboardStatistics,
    UserStatusStats,
    DailyRegistrations,
    DailyActivity,
    RecentUser,
)


class StatisticsService:
    """Service for gathering statistics."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_dashboard_statistics(self) -> DashboardStatistics:
        """Get complete dashboard statistics."""
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        two_weeks_ago = now - timedelta(days=14)
        two_months_ago = now - timedelta(days=60)
        
        # Get total users (not deleted)
        total_query = select(func.count(User.id)).where(User.deleted_at.is_(None))
        total_result = await self.db.execute(total_query)
        total_users = total_result.scalar() or 0
        
        # Get status breakdown
        status_stats = await self._get_status_stats()
        
        # Get new users this week
        new_week_query = select(func.count(User.id)).where(
            and_(
                User.deleted_at.is_(None),
                User.created_at >= week_ago
            )
        )
        new_week_result = await self.db.execute(new_week_query)
        new_users_week = new_week_result.scalar() or 0
        
        # Get new users last week (for trend calculation)
        prev_week_query = select(func.count(User.id)).where(
            and_(
                User.deleted_at.is_(None),
                User.created_at >= two_weeks_ago,
                User.created_at < week_ago
            )
        )
        prev_week_result = await self.db.execute(prev_week_query)
        prev_week_users = prev_week_result.scalar() or 0
        
        # Calculate weekly trend
        weekly_trend = 0.0
        if prev_week_users > 0:
            weekly_trend = ((new_users_week - prev_week_users) / prev_week_users) * 100
        elif new_users_week > 0:
            weekly_trend = 100.0
        
        # Get new users this month
        new_month_query = select(func.count(User.id)).where(
            and_(
                User.deleted_at.is_(None),
                User.created_at >= month_ago
            )
        )
        new_month_result = await self.db.execute(new_month_query)
        new_users_month = new_month_result.scalar() or 0
        
        # Get new users previous month (for trend)
        prev_month_query = select(func.count(User.id)).where(
            and_(
                User.deleted_at.is_(None),
                User.created_at >= two_months_ago,
                User.created_at < month_ago
            )
        )
        prev_month_result = await self.db.execute(prev_month_query)
        prev_month_users = prev_month_result.scalar() or 0
        
        # Calculate monthly trend
        monthly_trend = 0.0
        if prev_month_users > 0:
            monthly_trend = ((new_users_month - prev_month_users) / prev_month_users) * 100
        elif new_users_month > 0:
            monthly_trend = 100.0
        
        # Get registrations last 30 days
        registrations = await self._get_daily_registrations(30)
        
        # Get activity last 7 days
        activity = await self._get_daily_activity(7)
        
        # Get recent users
        recent_users = await self._get_recent_users(5)
        
        return DashboardStatistics(
            total_users=total_users,
            active_users=status_stats.active,
            new_users_week=new_users_week,
            new_users_month=new_users_month,
            blocked_users=status_stats.suspended + status_stats.locked,
            status_stats=status_stats,
            weekly_trend=round(weekly_trend, 1),
            monthly_trend=round(monthly_trend, 1),
            registrations_last_30_days=registrations,
            activity_last_7_days=activity,
            recent_users=recent_users,
        )
    
    async def _get_status_stats(self) -> UserStatusStats:
        """Get user count by status."""
        query = select(
            User.status,
            func.count(User.id)
        ).where(
            User.deleted_at.is_(None)
        ).group_by(User.status)
        
        result = await self.db.execute(query)
        rows = result.all()
        
        stats = UserStatusStats()
        for status, count in rows:
            if status == UserStatus.ACTIVE:
                stats.active = count
            elif status == UserStatus.INACTIVE:
                stats.inactive = count
            elif status == UserStatus.SUSPENDED:
                stats.suspended = count
            elif status == UserStatus.LOCKED:
                stats.locked = count
            elif status == UserStatus.PENDING_VERIFICATION:
                stats.pending_verification = count
        
        return stats
    
    async def _get_daily_registrations(self, days: int) -> List[DailyRegistrations]:
        """Get daily registration counts for the past N days."""
        now = datetime.utcnow()
        start_date = now - timedelta(days=days)
        
        # Group by date
        query = select(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('count')
        ).where(
            and_(
                User.deleted_at.is_(None),
                User.created_at >= start_date
            )
        ).group_by(
            func.date(User.created_at)
        ).order_by(
            func.date(User.created_at)
        )
        
        result = await self.db.execute(query)
        rows = result.all()
        
        # Create a dict of actual data
        data_dict = {str(row.date): row.count for row in rows}
        
        # Fill in all days
        registrations = []
        for i in range(days):
            date = (start_date + timedelta(days=i)).date()
            date_str = str(date)
            registrations.append(DailyRegistrations(
                date=date_str,
                count=data_dict.get(date_str, 0)
            ))
        
        return registrations
    
    async def _get_daily_activity(self, days: int) -> List[DailyActivity]:
        """Get daily activity for the past N days."""
        now = datetime.utcnow()
        start_date = now - timedelta(days=days)
        
        # Get users who logged in each day
        login_query = select(
            func.date(User.last_login_at).label('date'),
            func.count(func.distinct(User.id)).label('active_users')
        ).where(
            and_(
                User.deleted_at.is_(None),
                User.last_login_at >= start_date
            )
        ).group_by(
            func.date(User.last_login_at)
        )
        
        login_result = await self.db.execute(login_query)
        login_rows = login_result.all()
        login_dict = {str(row.date): row.active_users for row in login_rows}
        
        # Get registrations per day
        reg_query = select(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('count')
        ).where(
            and_(
                User.deleted_at.is_(None),
                User.created_at >= start_date
            )
        ).group_by(
            func.date(User.created_at)
        )
        
        reg_result = await self.db.execute(reg_query)
        reg_rows = reg_result.all()
        reg_dict = {str(row.date): row.count for row in reg_rows}
        
        # Fill in all days
        activity = []
        for i in range(days):
            date = (start_date + timedelta(days=i)).date()
            date_str = str(date)
            activity.append(DailyActivity(
                date=date_str,
                active_users=login_dict.get(date_str, 0),
                new_registrations=reg_dict.get(date_str, 0)
            ))
        
        return activity
    
    async def _get_recent_users(self, limit: int = 5) -> List[RecentUser]:
        """Get most recently registered users."""
        query = select(User).where(
            User.deleted_at.is_(None)
        ).order_by(
            User.created_at.desc()
        ).limit(limit)
        
        result = await self.db.execute(query)
        users = result.scalars().all()
        
        return [
            RecentUser(
                id=str(user.id),
                email=user.email,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                status=user.status.value if hasattr(user.status, 'value') else str(user.status),
                created_at=user.created_at,
            )
            for user in users
        ]
