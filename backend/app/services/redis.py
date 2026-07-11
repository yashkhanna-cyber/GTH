import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.redis = None

    async def connect(self):
        logger.info("Redis caching is disabled. Using dummy RedisService.")

    async def close(self):
        pass

    async def get(self, key: str) -> Optional[str]:
        return None

    async def set(self, key: str, value: str, expire: Optional[int] = None) -> bool:
        return True

    async def delete(self, key: str) -> bool:
        return True

    async def set_json(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        return True

    async def get_json(self, key: str) -> Optional[Any]:
        return None

    async def incr(self, key: str) -> Optional[int]:
        return None

    async def expire(self, key: str, seconds: int) -> bool:
        return True

redis_service = RedisService()
