import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.services.attendance import attendance_service
from app.dependencies.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("")
async def get_attendance(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns the student's attendance history log and rates.
    """
    return await attendance_service.get_student_attendance(db, current_user)
