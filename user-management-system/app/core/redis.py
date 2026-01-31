"""Redis connection and utilities."""

import logging
from typing import Optional
import redis.asyncio as redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """Redis client wrapper with connection management."""
    
    def __init__(self):
        self._client: Optional[redis.Redis] = None
        self._max_retries: int = 3
        self._retry_delay: float = 1.0
    
    async def connect(self, max_retries: int = 3) -> None:
        """Connect to Redis with retry logic."""
        import asyncio
        
        for attempt in range(max_retries):
            try:
                self._client = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_keepalive=True,
                    health_check_interval=30,
                )
                # Test connection
                await self._client.ping()
                logger.info("Redis connected successfully")
                return
            except Exception as e:
                logger.warning(f"Redis connection attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(self._retry_delay * (attempt + 1))
                else:
                    logger.error("Failed to connect to Redis after all retries")
                    raise
    
    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self._client:
            try:
                await self._client.close()
                logger.info("Redis disconnected")
            except Exception as e:
                logger.warning(f"Error disconnecting from Redis: {e}")
            finally:
                self._client = None
    
    @property
    def client(self) -> redis.Redis:
        """Get Redis client instance."""
        if not self._client:
            raise RuntimeError("Redis client not connected. Call connect() first.")
        return self._client
    
    @property
    def is_connected(self) -> bool:
        """Check if client is initialized."""
        return self._client is not None
    
    async def check_connection(self) -> bool:
        """Check if Redis connection is alive."""
        try:
            if self._client:
                await self._client.ping()
                return True
            return False
        except Exception as e:
            logger.warning(f"Redis health check failed: {e}")
            return False
    
    # Convenience methods
    async def get(self, key: str) -> Optional[str]:
        """Get value by key."""
        return await self.client.get(key)
    
    async def set(
        self,
        key: str,
        value: str,
        expire: Optional[int] = None,
    ) -> bool:
        """Set value with optional expiration in seconds."""
        return await self.client.set(key, value, ex=expire)
    
    async def delete(self, key: str) -> int:
        """Delete key."""
        return await self.client.delete(key)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        return await self.client.exists(key) > 0
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Set key expiration."""
        return await self.client.expire(key, seconds)
    
    async def incr(self, key: str) -> int:
        """Increment key value."""
        return await self.client.incr(key)
    
    async def setex(self, key: str, seconds: int, value: str) -> bool:
        """Set key with expiration."""
        return await self.client.setex(key, seconds, value)
    
    # Hash operations
    async def hget(self, name: str, key: str) -> Optional[str]:
        """Get hash field value."""
        return await self.client.hget(name, key)
    
    async def hset(self, name: str, key: str, value: str) -> int:
        """Set hash field value."""
        return await self.client.hset(name, key, value)
    
    async def hdel(self, name: str, *keys: str) -> int:
        """Delete hash fields."""
        return await self.client.hdel(name, *keys)
    
    async def hgetall(self, name: str) -> dict:
        """Get all hash fields."""
        return await self.client.hgetall(name)
    
    # Set operations
    async def sadd(self, key: str, *values: str) -> int:
        """Add values to set."""
        return await self.client.sadd(key, *values)
    
    async def srem(self, key: str, *values: str) -> int:
        """Remove values from set."""
        return await self.client.srem(key, *values)
    
    async def smembers(self, key: str) -> set:
        """Get all set members."""
        return await self.client.smembers(key)
    
    async def sismember(self, key: str, value: str) -> bool:
        """Check if value is in set."""
        return await self.client.sismember(key, value)
    
    # Pub/Sub
    async def publish(self, channel: str, message: str) -> int:
        """Publish message to channel."""
        return await self.client.publish(channel, message)


# Global Redis client instance
redis_client = RedisClient()


async def get_redis() -> RedisClient:
    """Get Redis client dependency."""
    return redis_client
