import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, or_
from app.database.session import get_db
from app.models.user import User
from app.models.announcement import Announcement
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.dependencies.auth import require_admin
from app.schemas.announcement import AnnouncementCreateInput

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/announcements", tags=["Admin Announcements"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_announcement(
    data: AnnouncementCreateInput,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Creates a new announcement and notifies target students (Admin only).
    """
    announcement = Announcement(
        title=data.title.strip(),
        message=data.message.strip(),
        type=data.type,
        target_group=data.targetGroup
    )
    db.add(announcement)
    await db.flush()  # Generate ID

    # Query target students to send notifications
    if data.targetGroup == "ALL" or not data.targetGroup:
        res_students = await db.execute(select(User).where(User.role == "Student"))
    else:
        res_students = await db.execute(
            select(User).where(and_(User.role == "Student", User.batch == data.targetGroup))
        )
    students = res_students.scalars().all()

    for s in students:
        notif = Notification(
            student_id=s.id,
            title=f"New Announcement: {data.title.strip()}",
            message=data.message.strip(),
            is_read=False
        )
        db.add(notif)

    # Log to Audit
    audit = AuditLog(
        user_id=admin.id,
        action="Announcement Created",
        target_resource=f"announcement:{announcement.id}",
        ip_address=None,
        device_info=None
    )
    db.add(audit)

    await db.commit()
    return {
        "success": True,
        "announcement": {
            "id": str(announcement.id),
            "title": announcement.title,
            "message": announcement.message,
            "type": announcement.type,
            "targetGroup": announcement.target_group,
            "createdAt": announcement.created_at.isoformat()
        }
    }

@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Deletes an announcement (Admin only).
    """
    res = await db.execute(select(Announcement).where(Announcement.id == announcement_id))
    announcement = res.scalar_one_or_none()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    await db.execute(delete(Announcement).where(Announcement.id == announcement_id))

    # Log to Audit
    audit = AuditLog(
        user_id=admin.id,
        action="Announcement Deleted",
        target_resource=f"announcement:{announcement_id}",
        ip_address=None,
        device_info=None
    )
    db.add(audit)

    await db.commit()
    return {"success": True, "message": "Announcement deleted successfully"}
import datetime
