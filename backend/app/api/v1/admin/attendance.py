import logging
from datetime import date as date_type
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database.session import get_db
from app.models.user import User
from app.models.attendance import Attendance
from app.dependencies.auth import require_admin
from app.services.attendance import attendance_service
from app.schemas.attendance import AdminAttendanceUpdateInput

logger = logging.getLogger(__name__)
# Registered as prefix "/admin/attendance" in master router
router = APIRouter(prefix="/admin/attendance", tags=["Admin Attendance"])

@router.get("")
async def get_attendance_by_date(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Returns list of all students with their attendance status for a given date.
    Response format matches frontend expectations:
    { success: true, students: [{ id, name, email, photo, enrollmentNo, branch, batch, status }] }
    """
    # Parse the date or use today
    try:
        if date:
            target_date = date_type.fromisoformat(date)
        else:
            target_date = date_type.today()
    except ValueError:
        return {"success": False, "error": "Invalid date format. Use YYYY-MM-DD."}

    # Fetch all students
    res_students = await db.execute(
        select(User).where(User.role == "Student").order_by(User.full_name.asc())
    )
    students = res_students.scalars().all()

    # Fetch attendance records for the target date
    res_att = await db.execute(
        select(Attendance).where(Attendance.date == target_date)
    )
    records = res_att.scalars().all()

    # Build lookup: student_id -> status
    attendance_map = {}
    for r in records:
        attendance_map[r.student_id] = r.status

    # Build response matching frontend's StudentAttendance interface
    formatted = []
    for s in students:
        formatted.append({
            "id": str(s.id),
            "name": s.full_name,
            "email": s.email,
            "photo": s.photo,
            "enrollmentNo": s.enrollment_no or "",
            "branch": s.branch or "",
            "batch": s.batch or "",
            "status": attendance_map.get(s.id, None)
        })

    return {"success": True, "students": formatted}

@router.post("")
async def mark_attendance(
    payload: AdminAttendanceUpdateInput,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Marks or edits student attendance (Admin only).
    """
    return await attendance_service.update_attendance(db, admin, payload)
