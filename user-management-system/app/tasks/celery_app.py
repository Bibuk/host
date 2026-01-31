"""Celery application configuration."""

from celery import Celery

from app.core.config import settings


celery_app = Celery(
    "user_management",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.email_tasks",
        "app.tasks.notification_tasks",
        "app.tasks.cleanup_tasks",
    ],
)

# Celery configuration
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # Timezone
    timezone="UTC",
    enable_utc=True,
    
    # Task execution
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
    task_acks_late=True,  # Acknowledge after task completion
    task_reject_on_worker_lost=True,  # Reject task if worker is lost
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_concurrency=2,
    worker_max_tasks_per_child=1000,  # Restart worker after N tasks to prevent memory leaks
    
    # Results
    result_expires=3600,  # 1 hour
    result_extended=True,  # Store additional task metadata
    
    # Retry settings
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=10,
    
    # Dead letter queue for failed tasks
    task_default_queue="default",
    task_queues={
        "default": {},
        "emails": {"routing_key": "emails"},
        "notifications": {"routing_key": "notifications"},
        "cleanup": {"routing_key": "cleanup"},
    },
    task_routes={
        "app.tasks.email_tasks.*": {"queue": "emails"},
        "app.tasks.notification_tasks.*": {"queue": "notifications"},
        "app.tasks.cleanup_tasks.*": {"queue": "cleanup"},
    },
)

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "cleanup-expired-sessions": {
        "task": "app.tasks.cleanup_tasks.cleanup_expired_sessions",
        "schedule": 3600.0,  # Every hour
    },
    "cleanup-old-audit-logs": {
        "task": "app.tasks.cleanup_tasks.cleanup_old_audit_logs",
        "schedule": 86400.0,  # Every 24 hours
    },
    "send-pending-notifications": {
        "task": "app.tasks.notification_tasks.send_pending_notifications",
        "schedule": 60.0,  # Every minute
    },
}
