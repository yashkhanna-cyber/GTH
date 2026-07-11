import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.user import User
from app.models.certificate import Certificate
from app.dependencies.auth import get_current_user
from app.schemas.certificate import StudentCertificatesListResponse, CertificateResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.get("", response_model=StudentCertificatesListResponse)
async def get_certificates(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns student certificates and dynamically evaluates unlock eligibility based on total points.
    """
    # Fetch certificate templates
    res_certs = await db.execute(select(Certificate).order_by(Certificate.required_xp.asc()))
    certs = res_certs.scalars().all()

    student_points = current_user.total_points or 0
    formatted = []

    for cert in certs:
        is_unlocked = student_points >= cert.required_xp
        date_str = cert.created_at.strftime("%B %d, %Y")

        formatted.append(CertificateResponse(
            id=cert.id,
            title=cert.title,
            description=cert.description,
            requiredXp=cert.required_xp,
            unlocked=is_unlocked,
            date=date_str
        ))

    return StudentCertificatesListResponse(
        success=True,
        studentName=current_user.full_name,
        studentPoints=student_points,
        certificates=formatted
    )
