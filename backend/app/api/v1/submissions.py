import logging
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.user import User
from app.models.task import TaskSubmission
from app.schemas.task import SubmissionCreateInput, SubmissionReviewInput, StudentSubmissionSummary
from app.dependencies.auth import get_current_user, require_admin
from app.services.task import task_service

logger = logging.getLogger(__name__)
# Registered as prefix "/tasks/submissions" in master router
router = APIRouter(prefix="/tasks/submissions", tags=["Task Submissions"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_task(
    submission_data: SubmissionCreateInput,
    db: AsyncSession = Depends(get_db),
    student: User = Depends(get_current_user)
):
    """
    Submits student work for a task.
    """
    if student.role.upper() != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit tasks"
        )
    return await task_service.submit_task(db, student, submission_data)

class AdminSubmissionReviewPayload(SubmissionReviewInput):
    submissionId: uuid.UUID

@router.put("", status_code=status.HTTP_200_OK)
async def review_submission(
    review_data: AdminSubmissionReviewPayload,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Reviews a task submission (Admin only).
    """
    return await task_service.review_submission(
        db, admin, review_data.submissionId, review_data
    )

@router.get("/pending", response_model=List[StudentSubmissionSummary])
async def get_pending_submissions(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Returns list of all pending task submissions for admin review.
    """
    # Fetch submissions with status 'PENDING'
    query = (
        select(TaskSubmission)
        .where(TaskSubmission.status == "PENDING")
        .order_by(TaskSubmission.submitted_at.asc())
    )
    res = await db.execute(query)
    subs = res.scalars().all()

    formatted = []
    for s in subs:
        student = s.student
        task = s.task
        
        student_name = student.full_name if student else "Unknown"
        student_email = student.email if student else ""
        enrollment_no = student.enrollment_no if student else ""
        team_name = student.team if student else None
        task_title = task.title if task else "Unknown Task"

        formatted.append(StudentSubmissionSummary(
            id=s.id,
            studentName=student_name,
            studentEmail=student_email,
            enrollmentNo=enrollment_no,
            teamName=team_name,
            uploadedFile=s.uploaded_file,
            comment=s.comment or "",
            status=s.status,
            reviewComment=s.review_comment or "",
            pointsAwarded=s.points_awarded,
            submittedAt=s.submitted_at,
            taskTitle=task_title
        ))
    return formatted
