import logging
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database.session import get_db
from app.models.user import User
from app.models.certificate import Certificate
from app.models.audit_log import AuditLog
from app.dependencies.auth import require_admin
from app.schemas.certificate import CertificateTemplateCreateInput, CertificateTemplateResponse, CertificateTemplateListResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/certificates", tags=["Admin Certificates"])

@router.get("", response_model=CertificateTemplateListResponse)
async def get_all_templates(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """
    Returns list of all certificate templates (Admin only).
    """
    res = await db.execute(select(Certificate).order_by(Certificate.required_xp.asc()))
    templates = res.scalars().all()
    
    formatted = [CertificateTemplateResponse(
        id=t.id,
        title=t.title,
        description=t.description,
        requiredXp=t.required_xp,
        required_xp=t.required_xp,
        createdAt=t.created_at,
        created_at=t.created_at
    ) for t in templates]
    
    return CertificateTemplateListResponse(
        success=True,
        certificates=formatted
    )

@router.post("", response_model=CertificateTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    data: CertificateTemplateCreateInput,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Creates a new certificate template (Admin only).
    """
    template = Certificate(
        title=data.title.strip(),
        description=data.description.strip(),
        required_xp=data.requiredXp
    )
    db.add(template)
    await db.flush()

    # Log to Audit
    audit = AuditLog(
        user_id=admin.id,
        action="Certificate Template Created",
        target_resource=f"certificate:{template.id}",
        ip_address=None,
        device_info=None
    )
    db.add(audit)

    await db.commit()
    return CertificateTemplateResponse(
        id=template.id,
        title=template.title,
        description=template.description,
        requiredXp=template.required_xp,
        required_xp=template.required_xp,
        createdAt=template.created_at,
        created_at=template.created_at
    )

@router.delete("/{certificate_id}")
async def delete_template(
    certificate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Deletes a certificate template (Admin only).
    """
    res = await db.execute(select(Certificate).where(Certificate.id == certificate_id))
    template = res.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate template not found")

    await db.execute(delete(Certificate).where(Certificate.id == certificate_id))

    # Log to Audit
    audit = AuditLog(
        user_id=admin.id,
        action="Certificate Template Deleted",
        target_resource=f"certificate:{certificate_id}",
        ip_address=None,
        device_info=None
    )
    db.add(audit)

    await db.commit()
    return {"success": True, "message": "Certificate template deleted successfully"}
