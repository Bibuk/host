"""Application configuration using Pydantic Settings."""

import secrets
import warnings
from typing import List, Optional
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # App settings
    APP_NAME: str = "User Management System"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "userdb"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/userdb"
    
    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://redis:6379"
    
    # Security
    SECRET_KEY: str = "your_super_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"
    
    # Email (Optional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@example.com"
    SMTP_TLS: bool = True
    
    # Frontend URLs (for email links)
    FRONTEND_URL: str = "http://localhost:3000"
    ADMIN_FRONTEND_URL: str = "http://localhost:3001"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:8080,http://host.docker.internal:3000,http://host.docker.internal:3001"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    @property
    def database_url_sync(self) -> str:
        return self.DATABASE_URL.replace("+asyncpg", "")
    
    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        default_key = "your_super_secret_key_change_in_production"
        if self.SECRET_KEY == default_key:
            if not self.DEBUG:
                raise ValueError("SECRET_KEY must be changed in production")
            warnings.warn("Using default SECRET_KEY. Change this in production!", stacklevel=2)
        return self


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
