import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
async def get_all_attendance(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """
    Returns list of all student attendance records for administrative overview.
    """
    # Fetch all students
    res_students = await db.execute(select(User).where(User.role == "Student").order_by(User.full_name.asc()))
    students = res_students.scalars().all()

    # Fetch all attendance records
    res_att = await db.execute(select(Attendance).order_by(Attendance.date.desc()))
    records = res_att.scalars().all()

    # Group records by student
    grouped_records = {}
    for r in records:
        if r.student_id not in grouped_records:
            grouped_records[r.student_id] = []
        grouped_records[r.student_id].append({
            "id": str(r.id),
            "date": r.date.isoformat(),
            "status": r.status,
            "createdAt": r.created_at.isoformat()
        })

    formatted = []
    for s in students:
        formatted.append({
            "studentId": str(s.id),
            "studentName": s.full_name,
            "enrollmentNo": s.enrollment_no or "",
            "batch": s.batch or "",
            "team": s.team or "",
            "attendance": grouped_records.get(s.id, [])
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
