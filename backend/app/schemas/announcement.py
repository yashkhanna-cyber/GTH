import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AnnouncementCreateInput(BaseModel):
    title: str
    message: str
    type: str = "General"  # 'General', 'Urgent', 'Task'
    targetGroup: Optional[str] = "ALL"  # e.g. Batch A, ALL

class AnnouncementResponse(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    type: str
    targetGroup: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True
