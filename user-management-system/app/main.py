"""FastAPI main application."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import close_db, check_db_connection
from app.core.redis import redis_client
from app.api.v1 import router as v1_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan handler."""
    # Startup
    print(f"Starting {settings.APP_NAME}...")
    
    # Connect to Redis
    await redis_client.connect()
    print("Redis connected")
    
    # Check database connection
    db_ok = await check_db_connection()
    if db_ok:
        print("Database connection verified")
    else:
        print("WARNING: Database connection failed!")
    
    # NOTE: Use Alembic migrations for database schema management
    # Run: alembic upgrade head
    
    yield
    
    # Shutdown
    print(f"Shutting down {settings.APP_NAME}...")
    
    # Disconnect Redis
    await redis_client.disconnect()
    print("Redis disconnected")
    
    # Close database connections
    await close_db()
    print("Database connections closed")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="User Management System with RBAC, JWT Auth, and Real-time features",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(v1_router, prefix=settings.API_V1_PREFIX)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": str(exc),
                "type": type(exc).__name__,
            },
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Check application health."""
    db_healthy = await check_db_connection()
    redis_healthy = await redis_client.check_connection()
    
    healthy = db_healthy and redis_healthy
    
    return {
        "status": "healthy" if healthy else "unhealthy",
        "database": "connected" if db_healthy else "disconnected",
        "redis": "connected" if redis_healthy else "disconnected",
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else None,
    }
