import base64
import logging
import uuid
from io import BytesIO
from typing import Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User
from app.models.referral import Referral
from app.models.notification import Notification
from app.schemas.auth import RegisterInput, LoginInput
from app.auth.password import get_password_hash, verify_password
from app.auth.jwt import create_access_token, create_refresh_token
from app.storage.manager import storage_manager
import asyncio
from app.tasks import background_tasks

logger = logging.getLogger(__name__)

class AuthService:
    async def register_user(self, db: AsyncSession, register_data: RegisterInput) -> User:
        """
        Registers a new user, processes optional profile photo uploads,
        handles referrals, and creates point logs/notifications in a transaction.
        """
        # Check if email already exists
        existing_email_res = await db.execute(select(User).where(User.email == register_data.email))
        if existing_email_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered"
            )

        # Check if enrollment number is already registered (for students)
        if register_data.enrollmentNo:
            existing_enrollment_res = await db.execute(
                select(User).where(User.enrollment_no == register_data.enrollmentNo)
            )
            if existing_enrollment_res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Enrollment number is already registered"
                )

        # Process photo upload if base64 data url is provided
        photo_url = None
        if register_data.photo:
            try:
                # Expect format: data:image/png;base64,...
                if "," in register_data.photo:
                    header, base64_str = register_data.photo.split(",", 1)
                    mime_type = header.split(";")[0].split(":")[1]
                else:
                    base64_str = register_data.photo
                    mime_type = "image/png"

                image_bytes = base64.b64decode(base64_str)
                file_like = BytesIO(image_bytes)
                
                # Upload to storage provider
                stored_filename, photo_url = storage_manager.upload_file(
                    file_like, f"profile_{register_data.enrollmentNo or 'avatar'}.png", mime_type, bucket="profile-images"
                )
            except Exception as e:
                logger.error(f"Failed to process registration avatar: {e}")
                # Don't fail registration just because photo upload failed, but log it

        # Verify referral code if provided
        referrer = None
        if register_data.referralCode:
            referrer_res = await db.execute(
                select(User).where(User.referral_code == register_data.referralCode.strip())
            )
            referrer = referrer_res.scalar_one_or_none()
            if not referrer:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid referral code"
                )

        # Create new student profile
        # Referral code format: GTH-ENROLLMENTNO or GTH-UUID
        code_suffix = register_data.enrollmentNo.upper() if register_data.enrollmentNo else str(uuid.uuid4())[:8].upper()
        new_referral_code = f"GTH-{code_suffix}"

        # Initialize student points to 0. If they used a referral code, the referrer gets points, 
        # and maybe the new student also gets points. Let's look at register/route.ts:
        # In current JS: referrer gets 250 points, new_student gets 0 points.
        new_user = User(
            full_name=register_data.fullName,
            email=register_data.email,
            password_hash=get_password_hash(register_data.password),
            role="Student",
            enrollment_no=register_data.enrollmentNo,
            branch=register_data.branch,
            year=register_data.year,
            batch=register_data.batch,
            skills=register_data.skills,
            bio=register_data.bio,
            photo=photo_url,
            referral_code=new_referral_code,
            total_points=0
        )
        db.add(new_user)
        await db.flush()  # Generate user ID

        # Process referral rewards
        if referrer:
            referral_bonus = 250  # Default value
            # Create Referral entry
            referral_entry = Referral(
                referrer_student=referrer.id,
                new_student=new_user.id,
                points_awarded=referral_bonus
            )
            db.add(referral_entry)
            
            # Enqueue asynchronous bonus processing task to prevent transaction blocking
            asyncio.create_task(background_tasks.process_referral_bonus_task(str(referrer.id), str(new_user.id), referral_bonus))

        # Welcome notification
        welcome_notif = Notification(
            student_id=new_user.id,
            title="Welcome to GTH TechVerse 2026!",
            message=f"Hey {new_user.full_name}, welcome to the Future Skills Bootcamp! Complete tasks, earn points, and make it to the top of the leaderboard.",
            is_read=False
        )
        db.add(welcome_notif)

        await db.commit()
        
        # Trigger leaderboard recalculation task
        asyncio.create_task(background_tasks.recalculate_leaderboard_task())
        
        return new_user

    async def login_user(self, db: AsyncSession, login_data: LoginInput) -> Tuple[User, str, str]:
        """
        Validates login credentials.
        Returns tuple: (User, access_token, refresh_token)
        """
        result = await db.execute(select(User).where(User.email == login_data.email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Payload matching original JS JWTPayload
        token_payload = {
            "userId": str(user.id),
            "email": user.email,
            "role": user.role.upper(),  # Match JS Uppercase role check
            "name": user.full_name
        }

        access_token = create_access_token(data=token_payload)
        refresh_token = create_refresh_token(data=token_payload)

        return user, access_token, refresh_token

auth_service = AuthService()
