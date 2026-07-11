import base64
import logging
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.models.file_upload import FileUpload
from app.dependencies.auth import get_current_user
from app.storage.manager import storage_manager
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/profile", tags=["Profile"])

class ProfileUpdateInput(BaseModel):
    bio: Optional[str] = None
    skills: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    instagram: Optional[str] = None
    photo: Optional[str] = None  # Base64 string or image URL

@router.post("")
async def update_profile(
    data: ProfileUpdateInput,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the logged-in student's profile, including avatar uploading.
    """
    photo_url = None
    
    if data.photo:
        if data.photo.startswith("data:image/"):
            try:
                header, base64_str = data.photo.split(",", 1)
                mime_type = header.split(";")[0].split(":")[1]
                ext = mime_type.split("/")[1]
                filename = f"avatar-{current_user.id}-{int(datetime.datetime.utcnow().timestamp())}.{ext}"

                image_bytes = base64.b64decode(base64_str)
                file_like = BytesIO(image_bytes)

                stored_filename, photo_url = storage_manager.upload_file(file_like, filename, mime_type, bucket="profile-images")

                # Save file upload details
                db_upload = FileUpload(
                    original_filename=filename,
                    stored_filename=stored_filename,
                    file_url=photo_url,
                    mime_type=mime_type,
                    file_size=len(image_bytes),
                    uploaded_by=current_user.id
                )
                db.add(db_upload)
                await db.flush()
            except Exception as e:
                logger.error(f"Avatar upload failed: {e}")
                photo_url = data.photo  # Fallback to base64 string or original value
        else:
            photo_url = data.photo
    
    try:
        # Update user fields
        current_user.bio = data.bio if data.bio else None
        current_user.skills = data.skills if data.skills else None
        current_user.linkedin = data.linkedin if data.linkedin else None
        current_user.github = data.github if data.github else None
        current_user.instagram = data.instagram if data.instagram else None
        
        if photo_url is not None:
            current_user.photo = photo_url

        db.add(current_user)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to update profile: {e}")
        # Note: Match the HTTP 550 error code of the Next.js API route!
        raise HTTPException(
            status_code=550,
            detail="Failed to update profile"
        )

    return {"success": True, "photoUrl": photo_url or current_user.photo}
import datetime
