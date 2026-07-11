import logging
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from app.database.session import get_db
from app.models.user import User
from app.models.notification import Notification
from app.dependencies.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
async def get_notifications(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns student notifications, calculating time ago and assigning dynamic types.
    """
    query = (
        select(Notification)
        .where(Notification.student_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    res = await db.execute(query)
    list_items = res.scalars().all()

    now = datetime.datetime.utcnow()
    formatted = []

    for item in list_items:
        diff_ms = (now - item.created_at).total_seconds() * 1000
        diff_mins = round(diff_ms / 60000)
        time_str = "Just now"

        if diff_mins >= 1440:
            diff_days = int(diff_mins / 1440)
            time_str = f"{diff_days} {'day' if diff_days == 1 else 'days'} ago"
        elif diff_mins >= 60:
            diff_hrs = int(diff_mins / 60)
            time_str = f"{diff_hrs} {'hour' if diff_hrs == 1 else 'hours'} ago"
        elif diff_mins > 0:
            time_str = f"{diff_mins} min ago"

        # Determine type based on keywords
        msg_lower = item.message.lower()
        title_lower = item.title.lower()
        
        type_str = "INFO"
        if "approved" in title_lower or "earned" in msg_lower or "restored" in msg_lower or "unlocked" in title_lower:
            type_str = "SUCCESS"
        elif "warning" in msg_lower or "absent" in msg_lower or "warning" in title_lower:
            type_str = "WARNING"
        elif "error" in msg_lower or "fail" in msg_lower or "reject" in msg_lower:
            type_str = "ERROR"

        formatted.append({
            "id": str(item.id),
            "title": item.title,
            "message": item.message,
            "read": item.is_read,
            "time": time_str,
            "type": type_str
        })

    return {"success": True, "notifications": formatted}

@router.post("")
async def mark_notifications_read(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Marks all unread notifications of the user as read.
    """
    query = (
        update(Notification)
        .where(and_(Notification.student_id == current_user.id, Notification.is_read == False))
        .values(is_read=True)
    )
    await db.execute(query)
    await db.commit()
    return {"success": True}
