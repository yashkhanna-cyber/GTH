import jwt
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)

COOKIE_NAME = "gth-session"
REFRESH_COOKIE_NAME = "gth-refresh-token"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates an access token (usually 30 minutes expiration)."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Standardize field names to match JS: userId, email, role, name
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_resolved, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Generates a refresh token (usually 7 days expiration)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    encoded_jwt = jwt.encode(to_encode, settings.jwt_refresh_secret_resolved, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str, is_refresh: bool = False) -> Optional[dict]:
    """Verifies a JWT token and returns its decoded payload."""
    try:
        secret = settings.jwt_refresh_secret_resolved if is_refresh else settings.jwt_secret_resolved
        payload = jwt.decode(token, secret, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token signature has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {e}")
        return None
