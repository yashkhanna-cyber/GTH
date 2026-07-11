import base64
import logging
import uuid
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status
from app.models.user import User
from app.models.task import Task, TaskSubmission
from app.models.file_upload import FileUpload
from app.models.points import PointsHistory
from app.models.notification import Notification
from app.schemas.task import SubmissionCreateInput, SubmissionReviewInput
from app.storage.manager import storage_manager
import asyncio
from app.tasks import background_tasks

logger = logging.getLogger(__name__)

class TaskService:
    async def get_student_tasks(self, db: AsyncSession, student: User) -> List[Dict[str, Any]]:
        """
        Retrieves all tasks assigned to the student (ALL, BATCH, or TEAM),
        aggregating their submission details.
        """
        # Fetch all tasks
        res_tasks = await db.execute(select(Task).order_by(Task.deadline.asc()))
        tasks = res_tasks.scalars().all()

        student_team = student.team or ""
        student_batch = student.batch or ""

        assigned_tasks = []
        for task in tasks:
            # Check assignment filter
            is_assigned = False
            if task.assigned_to == "ALL":
                is_assigned = True
            elif task.assigned_to == "BATCH" and task.assigned_target == student_batch:
                is_assigned = True
            elif task.assigned_to == "TEAM" and task.assigned_target == student_team:
                is_assigned = True

            if is_assigned:
                # Fetch student's submission for this task
                res_sub = await db.execute(
                    select(TaskSubmission).where(
                        and_(TaskSubmission.task_id == task.id, TaskSubmission.student_id == student.id)
                    )
                )
                submission = res_sub.scalar_one_or_none()

                sub_data = None
                if submission:
                    sub_data = {
                        "id": str(submission.id),
                        "uploadedFile": submission.uploaded_file,
                        "comment": submission.comment or "",
                        "status": submission.status,
                        "reviewComment": submission.review_comment or "",
                        "pointsAwarded": submission.points_awarded,
                        "submittedAt": submission.submitted_at.isoformat()
                    }

                assigned_tasks.append({
                    "id": str(task.id),
                    "title": task.title,
                    "description": task.description,
                    "rules": task.rules or "",
                    "points": task.points,
                    "deadline": task.deadline.isoformat(),
                    "referenceFile": task.reference_file or "",
                    "assignedTo": task.assigned_to,
                    "assignedTarget": task.assigned_target or "",
                    "submission": sub_data
                })

        return assigned_tasks

    async def submit_task(self, db: AsyncSession, student: User, data: SubmissionCreateInput) -> Dict[str, Any]:
        """
        Submits student's work for a task. Uploads base64 file to configured storage provider.
        Upserts submission records.
        """
        # 1. Fetch Task
        res_task = await db.execute(select(Task).where(Task.id == data.taskId))
        task = res_task.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

        # 2. Check Deadline
        # If deadline has timezone, make sure current UTC time is matched
        now_time = datetime.utcnow()
        task_deadline = task.deadline.replace(tzinfo=None)
        if now_time > task_deadline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The deadline for this task has passed"
            )

        # 3. Process base64 file upload
        file_url = None
        file_upload_id = None
        
        try:
            filename = f"task_{task.id[:8]}_{student.enrollment_no or 'sub'}.zip"
            mime_type = "application/zip"

            if "," in data.uploadedFile:
                header, base64_str = data.uploadedFile.split(",", 1)
                mime_type = header.split(";")[0].split(":")[1]
                # Try to extract extension from mime
                ext = mime_type.split("/")[1]
                filename = f"task_{str(task.id)[:8]}_{student.enrollment_no or 'sub'}.{ext}"
            else:
                base64_str = data.uploadedFile

            file_bytes = base64.b64decode(base64_str)
            file_like = BytesIO(file_bytes)
            
            stored_filename, file_url = storage_manager.upload_file(file_like, filename, mime_type, bucket="task-submissions")
            
            # Save file metadata in db
            db_upload = FileUpload(
                original_filename=filename,
                stored_filename=stored_filename,
                file_url=file_url,
                mime_type=mime_type,
                file_size=len(file_bytes),
                uploaded_by=student.id
            )
            db.add(db_upload)
            await db.flush()
            file_upload_id = db_upload.id

        except Exception as e:
            logger.error(f"File upload error for submission: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to upload file submission"
            )

        # 4. Upsert submission
        res_sub = await db.execute(
            select(TaskSubmission).where(
                and_(TaskSubmission.task_id == task.id, TaskSubmission.student_id == student.id)
            )
        )
        submission = res_sub.scalar_one_or_none()

        if submission:
            # Update existing submission
            submission.uploaded_file = file_url
            submission.file_upload_id = file_upload_id
            submission.comment = data.comment
            submission.status = "PENDING"
            submission.submitted_at = datetime.utcnow()
            submission.review_comment = None
            submission.points_awarded = 0
            db.add(submission)
        else:
            # Create new submission
            submission = TaskSubmission(
                student_id=student.id,
                task_id=task.id,
                uploaded_file=file_url,
                file_upload_id=file_upload_id,
                comment=data.comment,
                status="PENDING",
                points_awarded=0
            )
            db.add(submission)

        await db.commit()
        return {"success": True, "message": "Task submitted successfully"}

    async def review_submission(
        self, db: AsyncSession, admin: User, submission_id: uuid.UUID, data: SubmissionReviewInput
    ) -> Dict[str, Any]:
        """
        Reviews a student submission, awards points and records transaction.
        """
        # Fetch submission
        res_sub = await db.execute(
            select(TaskSubmission).where(TaskSubmission.id == submission_id)
        )
        sub = res_sub.scalar_one_or_none()
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission not found"
            )

        # Fetch student profile
        res_student = await db.execute(select(User).where(User.id == sub.student_id))
        student = res_student.scalar_one_or_none()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student user not found"
            )

        # Transaction details
        previous_points = sub.points_awarded
        net_change = data.pointsAwarded - previous_points

        # Update submission
        sub.status = data.status.upper()
        sub.review_comment = data.reviewComment
        sub.points_awarded = data.pointsAwarded
        db.add(sub)

        # Update student points if score changes
        if net_change != 0:
            student.total_points += net_change
            db.add(student)

            # Log to Points History
            points_log = PointsHistory(
                student_id=student.id,
                points=net_change,
                reason=f"Task Submission Review: {sub.task.title if sub.task else 'Task'}",
                given_by=admin.id
            )
            db.add(points_log)

        # Add student notification
        status_label = "Approved" if data.status.upper() == "APPROVED" else "Rejected"
        notification = Notification(
            student_id=student.id,
            title=f"Task Submission {status_label}",
            message=f"Your submission for '{sub.task.title if sub.task else 'Task'}' has been reviewed by an Admin. Status: {status_label}. Points Awarded: {data.pointsAwarded}. Comments: {data.reviewComment or 'None'}",
            is_read=False
        )
        db.add(notification)

        await db.commit()

        # Recalculate leaderboard
        asyncio.create_task(background_tasks.recalculate_leaderboard_task())
        return {"success": True}

task_service = TaskService()
