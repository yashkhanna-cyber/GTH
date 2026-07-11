import base64
import logging
import uuid
from typing import List, Optional
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_, and_
from app.database.session import get_db
from app.models.user import User
from app.models.project import Project
from app.models.file_upload import FileUpload
from app.schemas.project import ProjectCreateInput, ProjectResponse
from app.dependencies.auth import get_current_user, require_admin
from app.storage.manager import storage_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
async def get_projects(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns projects. Students receive only projects assigned to them. Admins receive all.
    """
    if current_user.role.upper() == "ADMIN":
        query = select(Project).order_by(Project.created_at.desc())
    else:
        # Student: filter by ALL, or specific batch, or specific team
        student_batch = current_user.batch or ""
        student_team = current_user.team or ""
        query = select(Project).where(
            or_(
                Project.assigned_to == "ALL",
                and_(Project.assigned_to == "BATCH", Project.assigned_target == student_batch),
                and_(Project.assigned_to == "TEAM", Project.assigned_target == student_team)
            )
        ).order_by(Project.created_at.desc())

    result = await db.execute(query)
    projects = result.scalars().all()

    # Format fields to fit schema naming conventions
    return [ProjectResponse(
        id=p.id,
        title=p.title,
        description=p.description,
        instructionPdf=p.instruction_pdf,
        assignedTo=p.assigned_to,
        assignedTarget=p.assigned_target,
        createdAt=p.created_at
    ) for p in projects]

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreateInput,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Creates a new project (Admin only). Handles PDF uploads.
    """
    pdf_url = None
    if project_data.instructionPdf:
        try:
            # Handle base64 PDF upload if provided
            if "," in project_data.instructionPdf:
                header, base64_str = project_data.instructionPdf.split(",", 1)
                mime_type = header.split(";")[0].split(":")[1]
            else:
                base64_str = project_data.instructionPdf
                mime_type = "application/pdf"

            file_bytes = base64.b64decode(base64_str)
            file_like = BytesIO(file_bytes)
            
            stored_filename, pdf_url = storage_manager.upload_file(
                file_like, f"project_{uuid.uuid4()[:8]}.pdf", mime_type, bucket="project-pdfs"
            )
            
            # Save file upload details
            db_upload = FileUpload(
                original_filename=f"project_{uuid.uuid4()[:8]}.pdf",
                stored_filename=stored_filename,
                file_url=pdf_url,
                mime_type=mime_type,
                file_size=len(file_bytes),
                uploaded_by=admin.id
            )
            db.add(db_upload)
            await db.flush()
        except Exception as e:
            logger.error(f"Failed to process project file upload: {e}")
            # If upload fails, raise error since instructions PDF is important
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to upload project PDF"
            )

    project = Project(
        title=project_data.title,
        description=project_data.description,
        instruction_pdf=pdf_url,
        assigned_to=project_data.assignedTo,
        assigned_target=project_data.assignedTarget,
        created_by=admin.id
    )
    db.add(project)
    await db.commit()

    return ProjectResponse(
        id=project.id,
        title=project.title,
        description=project.description,
        instructionPdf=project.instruction_pdf,
        assignedTo=project.assigned_to,
        assignedTarget=project.assigned_target,
        createdAt=project.created_at
    )

@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Deletes a project by ID (Admin only).
    """
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # If it had an uploaded file, delete it from storage
    if project.instruction_pdf:
        # Extract file name from URL (usually last element)
        file_name = project.instruction_pdf.split("/")[-1]
        storage_manager.delete_file(file_name, bucket="project-pdfs")

    await db.execute(delete(Project).where(Project.id == project_id))
    await db.commit()
    return {"success": True, "message": "Project deleted successfully"}
import uuid
