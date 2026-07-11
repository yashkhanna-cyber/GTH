import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class TaskCreateInput(BaseModel):
    title: str
    description: str
    rules: Optional[str] = None
    points: int = 100
    deadline: datetime
    referenceFile: Optional[str] = None
    assignedTo: str = "ALL"  # 'ALL', 'BATCH', 'TEAM'
    assignedTarget: Optional[str] = None

class SubmissionCreateInput(BaseModel):
    taskId: uuid.UUID
    uploadedFile: str  # Base64 data url or filename
    comment: Optional[str] = None

class SubmissionReviewInput(BaseModel):
    status: str  # 'APPROVED', 'REJECTED'
    reviewComment: Optional[str] = None
    reviewComments: Optional[str] = None
    pointsAwarded: int

class StudentUserDetail(BaseModel):
    name: str
    email: str

class SubmissionStudentDetail(BaseModel):
    id: uuid.UUID
    enrollmentNo: str
    batch: Optional[str] = None
    user: StudentUserDetail

# Responses
class SubmissionResponse(BaseModel):
    id: uuid.UUID
    uploadedFile: str
    comment: Optional[str] = None
    comments: Optional[str] = None
    status: str
    reviewComment: Optional[str] = None
    reviewComments: Optional[str] = None
    pointsAwarded: int
    submittedAt: datetime
    student: Optional[SubmissionStudentDetail] = None

class StudentSubmissionSummary(BaseModel):
    id: uuid.UUID
    studentName: str
    studentEmail: str
    enrollmentNo: str
    teamName: Optional[str] = None
    uploadedFile: str
    comment: Optional[str] = None
    status: str
    reviewComment: Optional[str] = None
    pointsAwarded: int
    submittedAt: datetime
    taskTitle: str

class TaskResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    rules: Optional[str] = None
    points: int
    deadline: datetime
    referenceFile: Optional[str] = None
    assignedTo: str
    assignedTarget: Optional[str] = None
    createdAt: datetime
    submissions: Optional[List[SubmissionResponse]] = None

    class Config:
        from_attributes = True

class TaskTeamResponse(BaseModel):
    id: uuid.UUID
    name: str

class TaskListResponse(BaseModel):
    success: bool = True
    tasks: List[TaskResponse]
    teams: Optional[List[TaskTeamResponse]] = None
