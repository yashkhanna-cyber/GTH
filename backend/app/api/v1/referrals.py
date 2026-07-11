import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.user import User
from app.models.referral import Referral
from app.schemas.referral import ReferralSummaryResponse, ReferredStudentResponse
from app.dependencies.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/referrals", tags=["Referrals"])

@router.get("", response_model=ReferralSummaryResponse)
async def get_referrals(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns referral details for the current user (code, count, list of referred students).
    """
    # Fetch referred students (Referral records where referrer_student = current_user.id)
    query = (
        select(Referral)
        .where(Referral.referrer_student == current_user.id)
        .order_by(Referral.created_at.desc())
    )
    res = await db.execute(query)
    referral_records = res.scalars().all()

    referred_students = []
    for record in referral_records:
        # Fetch referred student user profile
        student_res = await db.execute(select(User).where(User.id == record.new_student))
        student = student_res.scalar_one_or_none()
        if student:
            referred_students.append(ReferredStudentResponse(
                id=student.id,
                name=student.full_name,
                email=student.email,
                createdAt=record.created_at
            ))

    return ReferralSummaryResponse(
        success=True,
        referralCode=current_user.referral_code,
        referralCount=len(referred_students),
        referredStudents=referred_students
    )
