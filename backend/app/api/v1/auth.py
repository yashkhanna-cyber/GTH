import logging
from fastapi import APIRouter, Depends, Response, Request, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Optional
from app.database.session import get_db
from app.services.auth import auth_service
from app.schemas.auth import RegisterInput, LoginInput, AuthResponse
from app.schemas.user import UserMeResponseWrapper
from app.dependencies.auth import get_current_user_optional, get_current_user
from app.auth.jwt import COOKIE_NAME, REFRESH_COOKIE_NAME, verify_token, create_access_token
from app.models.user import User
from app.services.redis import redis_service
from app.middleware.rate_limit import RateLimiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Rate limiters
auth_rate_limiter = RateLimiter(requests_limit=5, window_seconds=60)

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(auth_rate_limiter)])
async def register(register_data: RegisterInput, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Registers a new student profile and logs them in.
    """
    user = await auth_service.register_user(db, register_data)
    
    # Auto-login after registration
    token_payload = {
        "userId": str(user.id),
        "email": user.email,
        "role": user.role.upper(),
        "name": user.full_name
    }
    access_token = create_access_token(data=token_payload)
    
    # Set session cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production (with SSL)
        samesite="lax",
        max_age=60 * 60 * 24 * 7,  # 7 days
        path="/"
    )
    
    user_summary = {
        "id": user.id,
        "email": user.email,
        "name": user.full_name,
        "role": user.role.upper(),
        "avatar": user.photo
    }
    return {"success": True, "user": user_summary, "message": "User registered successfully"}

@router.post("/login", response_model=AuthResponse, dependencies=[Depends(auth_rate_limiter)])
async def login(login_data: LoginInput, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Logs in a user, setting session and refresh tokens in HttpOnly cookies.
    """
    user, access_token, refresh_token = await auth_service.login_user(db, login_data)
    
    # Set HTTP Only Cookie for Session (Access Token)
    response.set_cookie(
        key=COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production (with SSL)
        samesite="lax",
        max_age=60 * 60 * 24 * 7,  # 7 days
        path="/"
    )

    # Set HTTP Only Cookie for Refresh Token
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/"
    )

    user_summary = {
        "id": user.id,
        "email": user.email,
        "name": user.full_name,
        "role": user.role.upper(),
        "avatar": user.photo
    }
    return {"success": True, "user": user_summary, "message": "Logged in successfully"}

@router.post("/logout")
async def logout(response: Response):
    """
    Logs out the user by clearing session cookies.
    """
    response.delete_cookie(COOKIE_NAME, path="/")
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/")
    return {"success": True, "message": "Logged out successfully"}

@router.get("/me", response_model=UserMeResponseWrapper)
async def me(request: Request, user: Optional[User] = Depends(get_current_user_optional), db: AsyncSession = Depends(get_db)):
    """
    Returns current user session profile data or raises 401.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: No active session"
        )
        
    # Build student dict if role is student
    student_info = None
    if user.role.upper() == "STUDENT":
        # Calculate rank dynamically
        rank_query = select(User.id).where(User.role == "Student").order_by(User.total_points.desc(), User.full_name.asc())
        rank_res = await db.execute(rank_query)
        sorted_ids = [row[0] for row in rank_res.all()]
        
        try:
            rank = sorted_ids.index(user.id) + 1
        except ValueError:
            rank = 1

        team_info = None
        if user.team:
            team_info = {"name": user.team}

        student_info = {
            "id": user.id,
            "enrollmentNo": user.enrollment_no or "",
            "branch": user.branch or "",
            "year": user.year,
            "batch": user.batch or "",
            "team": team_info,
            "leaderboard": {
                "totalPoints": user.total_points,
                "rank": rank
            }
        }

    user_payload = {
        "id": user.id,
        "email": user.email,
        "name": user.full_name,
        "role": user.role.upper(),
        "avatar": user.photo,
        "bio": user.bio or "",
        "skills": user.skills or "",
        "linkedin": user.linkedin or "",
        "github": user.github or "",
        "instagram": user.instagram or "",
        "student": student_info
    }
    
    return {"user": user_payload}

@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """
    Rotates access token using refresh token.
    """
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    payload = verify_token(refresh_token, is_refresh=True)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    # Generate new access token
    token_payload = {
        "userId": payload["userId"],
        "email": payload["email"],
        "role": payload["role"],
        "name": payload["name"]
    }
    access_token = create_access_token(data=token_payload)

    # Set session cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/"
    )

    return {"success": True, "message": "Token refreshed successfully"}
