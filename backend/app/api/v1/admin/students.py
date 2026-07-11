import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from app.database.session import get_db
from app.models.user import User
from app.models.team import Team
from app.models.audit_log import AuditLog
from app.dependencies.auth import require_admin
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/students", tags=["Admin Students"])

class StudentUpdateInput(BaseModel):
    fullName: Optional[str] = None
    email: Optional[EmailStr] = None
    enrollmentNo: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[int] = None
    batch: Optional[str] = None
    teamName: Optional[str] = None  # To associate with team name

@router.get("")
async def get_all_students(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """
    Returns list of all students with enrollment, team, and point info.
    """
    query = select(User).where(User.role == "Student").order_by(User.full_name.asc())
    res = await db.execute(query)
    students = res.scalars().all()

    formatted = []
    for s in students:
        formatted.append({
            "id": str(s.id),
            "fullName": s.full_name,
            "email": s.email,
            "enrollmentNo": s.enrollment_no or "",
            "branch": s.branch or "",
            "year": s.year,
            "batch": s.batch or "",
            "team": s.team or "",
            "totalPoints": s.total_points,
            "photo": s.photo
        })
    return {"success": True, "students": formatted}

@router.put("/{student_id}")
async def update_student(
    student_id: uuid.UUID,
    data: StudentUpdateInput,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Updates student details (Admin only).
    """
    res = await db.execute(select(User).where(User.id == student_id))
    student = res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    # Update basic fields
    if data.fullName is not None:
        student.full_name = data.fullName.strip()
    if data.email is not None:
        student.email = data.email
    if data.enrollmentNo is not None:
        student.enrollment_no = data.enrollmentNo.strip()
    if data.branch is not None:
        student.branch = data.branch
    if data.year is not None:
        student.year = data.year
    if data.batch is not None:
        student.batch = data.batch

    # Update Team
    if data.teamName is not None:
        team_name_clean = data.teamName.strip()
        if team_name_clean == "" or team_name_clean.lower() == "none":
            student.team = None
            student.team_id = None
        else:
            # Fetch or link team
            res_team = await db.execute(select(Team).where(Team.team_name == team_name_clean))
            team = res_team.scalar_one_or_none()
            if not team:
                # If team does not exist, create it or fail? Let's check team name and assign it, 
                # or raise error. It's safer to raise error and require team creation beforehand.
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, 
                    detail=f"Team '{team_name_clean}' does not exist"
                )
            student.team = team.team_name
            student.team_id = team.id

    db.add(student)

    # Log to Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="Student Profile Updated",
        target_resource=f"student:{student_id}",
        ip_address=None,
        device_info=None
    )
    db.add(audit)

    await db.commit()
    return {"success": True}

@router.delete("/{student_id}")
async def delete_student(
    student_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Deletes a student account (Admin only).
    """
    res = await db.execute(select(User).where(User.id == student_id))
    student = res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    await db.execute(delete(User).where(User.id == student_id))

    # Log to Audit Log
    audit = AuditLog(
        user_id=admin.id,
        action="Student Account Deleted",
        target_resource=f"student:{student_id}",
        ip_address=None,
        device_info=None
    )
    db.add(audit)

    await db.commit()
    return {"success": True, "message": "Student deleted successfully"}
