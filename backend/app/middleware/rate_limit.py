import logging
from fastapi import Request, HTTPException, status
from app.services.redis import redis_service

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, requests_limit: int = 5, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds

    async def __call__(self, request: Request):
        """
        Enforce rate limits per IP address and request path.
        """
        # Get client IP address
        client_ip = request.client.host if request.client else "unknown"
        
        # Build redis key
        key = f"rate_limit:{client_ip}:{request.url.path}"
        
        try:
            # Check current count in Redis
            current = await redis_service.get(key)
            
            if current and int(current) >= self.requests_limit:
                logger.warning(f"Rate limit exceeded for client {client_ip} on path {request.url.path}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later."
                )
            
            # Increment count
            count = await redis_service.incr(key)
            if count == 1:
                # Set expire if first request in window
                await redis_service.expire(key, self.window_seconds)
                
        except HTTPException:
            raise
        except Exception as e:
            # Fallback in case Redis is unavailable (fail open for UX, but log it)
            logger.error(f"Rate Limiter Redis Error: {e}")
