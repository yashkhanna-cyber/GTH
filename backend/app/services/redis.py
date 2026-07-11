import json
import logging
from typing import Any, Optional
from redis.asyncio import Redis, from_url
from app.config.settings import settings

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.redis: Optional[Redis] = None

    async def connect(self):
        """Initialize the Redis connection pool."""
        try:
            self.redis = from_url(settings.REDIS_URL, decode_responses=True)
            # Test connection
            await self.redis.ping()
            logger.info("Successfully connected to Redis.")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis = None

    async def close(self):
        """Close the Redis connection."""
        if self.redis:
            await self.redis.close()
            logger.info("Closed Redis connection.")

    async def get(self, key: str) -> Optional[str]:
        if not self.redis:
            return None
        try:
            return await self.redis.get(key)
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None

    async def set(self, key: str, value: str, expire: Optional[int] = None) -> bool:
        if not self.redis:
            return False
        try:
            if expire:
                await self.redis.set(key, value, ex=expire)
            else:
                await self.redis.set(key, value)
            return True
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        if not self.redis:
            return False
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False

    async def set_json(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        try:
            serialized = json.dumps(value)
            return await self.set(key, serialized, expire)
        except Exception as e:
            logger.error(f"Redis set_json serialization error: {e}")
            return False

    async def get_json(self, key: str) -> Optional[Any]:
        data = await self.get(key)
        if not data:
            return None
        try:
            return json.loads(data)
        except Exception as e:
            logger.error(f"Redis get_json deserialization error: {e}")
            return None

    async def incr(self, key: str) -> Optional[int]:
        if not self.redis:
            return None
        try:
            return await self.redis.incr(key)
        except Exception as e:
            logger.error(f"Redis incr error: {e}")
            return None

    async def expire(self, key: str, seconds: int) -> bool:
        if not self.redis:
            return False
        try:
            return await self.redis.expire(key, seconds)
        except Exception as e:
            logger.error(f"Redis expire error: {e}")
            return False

# Global instance
redis_service = RedisService()
