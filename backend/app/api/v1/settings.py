import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.user import User
from app.models.settings import SettingsModel
from app.dependencies.auth import get_current_user, require_admin
from pydantic import BaseModel
from typing import Dict, Any

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["System Settings"])

class SettingUpdateInput(BaseModel):
    value: str

@router.get("")
async def get_all_settings(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Returns dictionary of all system configuration settings.
    """
    res = await db.execute(select(SettingsModel))
    settings_list = res.scalars().all()
    
    # Return as key-value pairs
    settings_dict = {}
    for s in settings_list:
        val = s.value
        # Parse type
        if s.type == "int":
            val = int(s.value)
        elif s.type == "float":
            val = float(s.value)
        elif s.type == "bool":
            val = s.value.lower() in ("true", "1", "yes")
        settings_dict[s.key] = val
        
    return {"success": True, "settings": settings_dict}

@router.put("/{key}")
async def update_setting(
    key: str,
    payload: SettingUpdateInput,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Updates a system configuration setting value (Admin only).
    """
    res = await db.execute(select(SettingsModel).where(SettingsModel.key == key))
    setting = res.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setting not found")

    setting.value = payload.value.strip()
    db.add(setting)
    await db.commit()
    return {"success": True, "message": f"Setting '{key}' updated successfully."}
