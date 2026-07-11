import logging
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status
from app.models.user import User
from app.models.attendance import Attendance
from app.models.points import PointsHistory
from app.models.notification import Notification
from app.schemas.attendance import AdminAttendanceUpdateInput
import asyncio
from app.tasks import background_tasks

logger = logging.getLogger(__name__)

class AttendanceService:
    async def get_student_attendance(self, db: AsyncSession, student: User) -> Dict[str, Any]:
        """
        Retrieves attendance list and statistics for a specific student.
        """
        res = await db.execute(
            select(Attendance)
            .where(Attendance.student_id == student.id)
            .order_by(Attendance.date.desc())
        )
        records = res.scalars().all()

        present_count = len([r for r in records if r.status == "PRESENT"])
        absent_count = len([r for r in records if r.status == "ABSENT"])
        total_count = len(records)
        rate = int((present_count / total_count) * 100) if total_count > 0 else 100

        formatted_records = []
        for idx, r in enumerate(records):
            # Format date e.g. "October 15, 2026"
            date_str = r.date.strftime("%B %d, %Y")
            # Session numbering count down
            session_name = f"Session {total_count - idx}"
            time_str = r.created_at.strftime("%I:%M %p")

            formatted_records.append({
                "id": str(r.id),
                "date": date_str,
                "day": session_name,
                "status": r.status,
                "time": time_str
            })

        return {
            "success": True,
            "attendance": formatted_records,
            "presentCount": present_count,
            "absentCount": absent_count,
            "totalCount": total_count,
            "rate": rate
        }

    async def update_attendance(self, db: AsyncSession, admin: User, data: AdminAttendanceUpdateInput) -> Dict[str, Any]:
        """
        Records or updates student attendance. Applies a 100 points penalty for ABSENT,
        and refunds 100 points if ABSENT is corrected to PRESENT.
        """
        # Fetch target student
        res_student = await db.execute(select(User).where(User.id == data.studentId))
        student = res_student.scalar_one_or_none()
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

        # Check existing attendance record for this student on this date
        res_att = await db.execute(
            select(Attendance).where(
                and_(Attendance.student_id == data.studentId, Attendance.date == data.date)
            )
        )
        att = res_att.scalar_one_or_none()

        PENALTY_AMOUNT = 100

        if att:
            # Record already exists: check if status changed
            old_status = att.status
            new_status = data.status.upper()

            if old_status == new_status:
                # No change
                return {"success": True, "message": "Attendance status unchanged"}

            # Update status
            att.status = new_status
            db.add(att)

            if new_status == "PRESENT" and old_status == "ABSENT":
                # Restore penalty points (refund 100 points)
                student.total_points += PENALTY_AMOUNT
                db.add(student)

                # Log refund to points history
                points_log = PointsHistory(
                    student_id=student.id,
                    points=PENALTY_AMOUNT,
                    reason="Attendance status updated to PRESENT (Refund)",
                    given_by=admin.id
                )
                db.add(points_log)

                # Add Notification
                notification = Notification(
                    student_id=student.id,
                    title="Attendance Updated!",
                    message=f"Your attendance for {data.date.isoformat()} was corrected to PRESENT. {PENALTY_AMOUNT} points restored.",
                    is_read=False
                )
                db.add(notification)

            elif new_status == "ABSENT" and old_status == "PRESENT":
                # Deduct points (apply 100 points penalty)
                student.total_points -= PENALTY_AMOUNT
                db.add(student)

                # Log penalty to points history
                points_log = PointsHistory(
                    student_id=student.id,
                    points=-PENALTY_AMOUNT,
                    reason="Attendance Penalty - Absent",
                    given_by=admin.id
                )
                db.add(points_log)

                # Add Notification
                notification = Notification(
                    student_id=student.id,
                    title="Attendance Penalty Applied",
                    message=f"You were marked ABSENT for {data.date.isoformat()}. {PENALTY_AMOUNT} points deducted.",
                    is_read=False
                )
                db.add(notification)

        else:
            # New attendance record
            new_status = data.status.upper()
            att = Attendance(
                student_id=data.studentId,
                date=data.date,
                status=new_status
            )
            db.add(att)

            if new_status == "ABSENT":
                # Deduct points for new ABSENT record
                student.total_points -= PENALTY_AMOUNT
                db.add(student)

                # Log penalty to points history
                points_log = PointsHistory(
                    student_id=student.id,
                    points=-PENALTY_AMOUNT,
                    reason="Attendance Penalty - Absent",
                    given_by=admin.id
                )
                db.add(points_log)

                # Add Notification
                notification = Notification(
                    student_id=student.id,
                    title="Attendance Penalty Applied",
                    message=f"You were marked ABSENT for {data.date.isoformat()}. {PENALTY_AMOUNT} points deducted.",
                    is_read=False
                )
                db.add(notification)

        await db.commit()

        # Recalculate leaderboard
        asyncio.create_task(background_tasks.recalculate_leaderboard_task())
        return {"success": True}

attendance_service = AttendanceService()
