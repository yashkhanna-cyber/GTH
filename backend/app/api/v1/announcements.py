import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.database.session import get_db
from app.models.user import User
from app.models.announcement import Announcement
from app.dependencies.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/announcements", tags=["Announcements"])

@router.get("")
async def get_announcements(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns student announcements. Filters announcements by student batch/target group or general public groups.
    """
    if current_user.role.upper() == "ADMIN":
        query = select(Announcement).order_by(Announcement.created_at.desc())
    else:
        student_batch = current_user.batch or ""
        query = select(Announcement).where(
            or_(
                Announcement.target_group == "ALL",
                Announcement.target_group == student_batch,
                Announcement.target_group == None
            )
        ).order_by(Announcement.created_at.desc())

    res = await db.execute(query)
    list_ann = res.scalars().all()

    formatted = []
    for item in list_ann:
        formatted.append({
            "id": str(item.id),
            "title": item.title,
            "message": item.message,
            "type": item.type,
            "targetGroup": item.target_group or "ALL",
            "createdAt": item.created_at.isoformat()
        })

    return {"success": True, "announcements": formatted}
