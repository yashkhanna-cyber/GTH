import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.user import User
from app.models.points import PointsHistory
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.dependencies.auth import require_admin
from app.schemas.points import AdminPointsAdjustmentInput
import asyncio
from app.tasks import background_tasks
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/points", tags=["Admin Points"])

class AdminPointsAdjustmentPayload(AdminPointsAdjustmentInput):
    studentId: uuid.UUID

@router.post("")
async def adjust_points(
    payload: AdminPointsAdjustmentPayload,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Manually awards or deducts XP points from a student (Admin only).
    """
    res_student = await db.execute(select(User).where(User.id == payload.studentId))
    student = res_student.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    points_change = payload.amount
    if payload.type.upper() == "DEDUCT":
        points_change = -abs(payload.amount)

    # 1. Update points balance
    student.total_points += points_change
    db.add(student)

    # 2. Log in PointsHistory
    log = PointsHistory(
        student_id=student.id,
        points=points_change,
        reason=payload.reason.strip(),
        given_by=admin.id
    )
    db.add(log)

    # 3. Create Student Notification
    notif_action = "awarded" if points_change > 0 else "deduced"
    abs_change = abs(points_change)
    notification = Notification(
        student_id=student.id,
        title="Points Balance Adjusted",
        message=f"An Admin has {notif_action} {abs_change} points. Reason: {payload.reason.strip()}",
        is_read=False
    )
    db.add(notification)

    # 4. Log Audit Action
    audit = AuditLog(
        user_id=admin.id,
        action=f"Points Adjusted ({payload.type.upper()})",
        target_resource=f"student:{student.id}:points:{points_change}",
        ip_address=None,
        device_info=None
    )
    db.add(audit)

    await db.commit()

    # Recalculate leaderboard
    asyncio.create_task(background_tasks.recalculate_leaderboard_task())
    return {"success": True, "message": f"Successfully updated student points by {points_change}."}
