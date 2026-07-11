import logging
import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.models.user import User
from app.models.task import Task, TaskSubmission
from app.models.team import Team
from app.schemas.task import TaskCreateInput, TaskResponse, TaskListResponse, TaskTeamResponse
from app.dependencies.auth import get_current_user, require_admin
from app.services.task import task_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=TaskListResponse)
async def get_tasks(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns tasks list. Students receive only assigned tasks (with aggregated submissions).
    Admins receive all tasks.
    """
    formatted_tasks = []
    if current_user.role.upper() == "ADMIN":
        query = (
            select(Task)
            .options(selectinload(Task.submissions).selectinload(TaskSubmission.student))
            .order_by(Task.deadline.asc())
        )
        res = await db.execute(query)
        tasks = res.scalars().all()
        for t in tasks:
            subs = []
            for s in t.submissions:
                student_detail = None
                if s.student:
                    student_detail = {
                        "id": s.student.id,
                        "enrollmentNo": s.student.enrollment_no or "",
                        "batch": s.student.batch,
                        "user": {
                            "name": s.student.full_name,
                            "email": s.student.email
                        }
                    }
                subs.append({
                    "id": s.id,
                    "uploadedFile": s.uploaded_file,
                    "comment": s.comment or "",
                    "comments": s.comment or "",
                    "status": s.status,
                    "reviewComment": s.review_comment or "",
                    "reviewComments": s.review_comment or "",
                    "pointsAwarded": s.points_awarded,
                    "submittedAt": s.submitted_at,
                    "student": student_detail
                })
            
            formatted_tasks.append(TaskResponse(
                id=t.id,
                name=t.title,
                description=t.description or "",
                rules=t.rules or "",
                points=t.points,
                deadline=t.deadline,
                referenceFile=t.reference_file or "",
                assignedTo=t.assigned_to,
                assignedTarget=t.assigned_target or "",
                createdAt=t.created_at,
                submissions=subs
            ))
    else:
        # Student-specific list using task service
        tasks_data = await task_service.get_student_tasks(db, current_user)
        # Parse into response schema format
        for t in tasks_data:
            sub_res = None
            if t["submission"]:
                sub_res = [{
                    "id": uuid.UUID(t["submission"]["id"]),
                    "uploadedFile": t["submission"]["uploadedFile"],
                    "comment": t["submission"]["comment"],
                    "status": t["submission"]["status"],
                    "reviewComment": t["submission"]["reviewComment"],
                    "pointsAwarded": t["submission"]["pointsAwarded"],
                    "submittedAt": datetime.fromisoformat(t["submission"]["submittedAt"])
                }]
            formatted_tasks.append(TaskResponse(
                id=uuid.UUID(t["id"]),
                name=t["title"],
                description=t["description"] or "",
                rules=t["rules"] or "",
                points=t["points"],
                deadline=datetime.fromisoformat(t["deadline"]),
                referenceFile=t["referenceFile"] or "",
                assignedTo=t["assignedTo"],
                assignedTarget=t["assignedTarget"] or "",
                createdAt=datetime.utcnow(),  # Placeholder for schema compatibility
                submissions=sub_res
            ))

    formatted_teams = None
    if current_user.role.upper() == "ADMIN":
        teams_query = select(Team).order_by(Team.team_name.asc())
        teams_result = await db.execute(teams_query)
        db_teams = teams_result.scalars().all()
        formatted_teams = [TaskTeamResponse(id=t.id, name=t.team_name) for t in db_teams]

    return TaskListResponse(
        success=True,
        tasks=formatted_tasks,
        teams=formatted_teams
    )

import base64
from io import BytesIO
from app.models.file_upload import FileUpload
from app.storage.manager import storage_manager

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreateInput,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Creates a new task assignment (Admin only).
    """
    ref_file_url = None
    if task_data.referenceFile:
        try:
            # Handle base64 upload if provided
            if "," in task_data.referenceFile:
                header, base64_str = task_data.referenceFile.split(",", 1)
                mime_type = header.split(";")[0].split(":")[1]
            else:
                base64_str = task_data.referenceFile
                mime_type = "application/octet-stream"

            file_bytes = base64.b64decode(base64_str)
            file_like = BytesIO(file_bytes)
            
            stored_filename, ref_file_url = storage_manager.upload_file(
                file_like, f"task_ref_{str(uuid.uuid4())[:8]}", mime_type, bucket="task-references"
            )
            
            # Save file upload details
            db_upload = FileUpload(
                original_filename=f"task_ref_{str(uuid.uuid4())[:8]}",
                stored_filename=stored_filename,
                file_url=ref_file_url,
                mime_type=mime_type,
                file_size=len(file_bytes),
                uploaded_by=admin.id
            )
            db.add(db_upload)
            await db.flush()
        except Exception as e:
            logger.error(f"Failed to process task file upload: {e}")
            if "Read-only" in str(e) or "Read-only file system" in str(e) or isinstance(e, OSError):
                logger.info("Falling back to Base64 storage in database due to read-only filesystem.")
                ref_file_url = f"data:{mime_type};base64,{base64_str}"
            elif "Bucket not found" in str(e):
                 raise HTTPException(
                     status_code=status.HTTP_400_BAD_REQUEST,
                     detail="Supabase Error: Please create a public bucket named 'task-references' in your Supabase storage."
                 )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Upload Failed: {str(e)}"
                )

    task = Task(
        title=task_data.title,
        description=task_data.description,
        rules=task_data.rules,
        points=task_data.points,
        deadline=task_data.deadline,
        reference_file=ref_file_url or task_data.referenceFile,
        assigned_to=task_data.assignedTo,
        assigned_target=task_data.assignedTarget
    )
    db.add(task)
    await db.commit()

    return TaskResponse(
        id=task.id,
        name=task.title,
        description=task.description or "",
        rules=task.rules or "",
        points=task.points,
        deadline=task.deadline,
        referenceFile=task.reference_file or "",
        assignedTo=task.assigned_to,
        assignedTarget=task.assigned_target or "",
        createdAt=task.created_at
    )

@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Deletes a task by ID (Admin only).
    """
    res = await db.execute(select(Task).where(Task.id == task_id))
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    await db.execute(delete(Task).where(Task.id == task_id))
    await db.commit()
    return {"success": True, "message": "Task deleted successfully"}
