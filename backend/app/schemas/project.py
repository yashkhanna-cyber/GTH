import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ProjectCreateInput(BaseModel):
    title: str
    description: str
    instructionPdf: Optional[str] = None  # Base64 string if uploaded during creation, or direct URL
    assignedTo: str = "ALL"  # 'ALL', 'BATCH', 'TEAM'
    assignedTarget: Optional[str] = None  # Specific batch name or team name

class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    instructionPdf: Optional[str] = None
    assignedTo: str
    assignedTarget: Optional[str] = None
    createdAt: datetime

    class Config:
        from_attributes = True

class TeamResponse(BaseModel):
    id: uuid.UUID
    name: str

class ProjectListResponse(BaseModel):
    success: bool = True
    projects: List[ProjectResponse]
    teams: Optional[List[TeamResponse]] = None
