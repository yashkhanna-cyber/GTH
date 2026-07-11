import logging
import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database.session import get_db
from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskCreateInput, TaskResponse
from app.dependencies.auth import get_current_user, require_admin
from app.services.task import task_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskResponse])
async def get_tasks(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns tasks list. Students receive only assigned tasks (with aggregated submissions).
    Admins receive all tasks.
    """
    if current_user.role.upper() == "ADMIN":
        res = await db.execute(select(Task).order_by(Task.deadline.asc()))
        tasks = res.scalars().all()
        return [TaskResponse(
            id=t.id,
            title=t.title,
            description=t.description,
            rules=t.rules or "",
            points=t.points,
            deadline=t.deadline,
            referenceFile=t.reference_file or "",
            assignedTo=t.assigned_to,
            assignedTarget=t.assigned_target or "",
            createdAt=t.created_at
        ) for t in tasks]
    else:
        # Student-specific list using task service
        tasks_data = await task_service.get_student_tasks(db, current_user)
        # Parse into response schema format
        res_list = []
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
            res_list.append(TaskResponse(
                id=uuid.UUID(t["id"]),
                title=t["title"],
                description=t["description"],
                rules=t["rules"],
                points=t["points"],
                deadline=datetime.fromisoformat(t["deadline"]),
                referenceFile=t["referenceFile"],
                assignedTo=t["assignedTo"],
                assignedTarget=t["assignedTarget"],
                createdAt=datetime.utcnow(),  # Placeholder for schema compatibility
                submissions=sub_res
            ))
        return res_list

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreateInput,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Creates a new task assignment (Admin only).
    """
    task = Task(
        title=task_data.title,
        description=task_data.description,
        rules=task_data.rules,
        points=task_data.points,
        deadline=task_data.deadline,
        reference_file=task_data.referenceFile,
        assigned_to=task_data.assignedTo,
        assigned_target=task_data.assignedTarget
    )
    db.add(task)
    await db.commit()

    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
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
