import uuid
from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.database.session import get_db
from app.auth.jwt import verify_token, COOKIE_NAME
from app.models.user import User

async def get_current_user_optional(request: Request, db: AsyncSession = Depends(get_db)) -> Optional[User]:
    """Retrieves current user if token is present and valid; returns None otherwise."""
    # Check cookies first
    token = request.cookies.get(COOKIE_NAME)
    
    # Check Authorization header next
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return None

    payload = verify_token(token)
    if not payload or "userId" not in payload:
        return None

    # Fetch user from db
    try:
        user_id = uuid.UUID(payload["userId"]) if isinstance(payload["userId"], str) else payload["userId"]
    except ValueError:
        return None
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    return user

async def get_current_user(user: Optional[User] = Depends(get_current_user_optional)) -> User:
    """Dependency that enforces a valid authenticated session."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated or session expired"
        )
    return user

def require_role(allowed_roles: list[str]):
    """Decorator-like dependency factory to enforce RBAC constraints."""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        # Standardize matching to case-insensitive or exact. DB has role 'Student' / 'Admin'
        # Frontend has 'STUDENT' / 'ADMIN'
        user_role = user.role.upper()
        allowed_upper = [r.upper() for r in allowed_roles]
        
        if user_role not in allowed_upper:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: insufficient permissions"
            )
        return user
    return role_checker

# Helper dependencies
require_admin = require_role(["Admin"])
require_student = require_role(["Student"])
