import uuid
from datetime import datetime
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    isRead: bool
    createdAt: datetime

class NotificationCreate(BaseModel):
    studentId: uuid.UUID
    title: str
    message: str
