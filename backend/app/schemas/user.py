import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr

class StudentLeaderboard(BaseModel):
    totalPoints: int
    rank: int

class StudentTeam(BaseModel):
    name: str

class StudentInfo(BaseModel):
    id: uuid.UUID
    enrollmentNo: Optional[str] = ""
    branch: Optional[str] = ""
    year: Optional[int] = 1
    batch: Optional[str] = ""
    team: Optional[StudentTeam] = None
    leaderboard: Optional[StudentLeaderboard] = None

class UserBase(BaseModel):
    id: uuid.UUID
    email: EmailStr
    name: str
    role: str
    avatar: Optional[str] = None
    bio: Optional[str] = ""
    skills: Optional[str] = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    instagram: Optional[str] = ""

class UserMeResponse(UserBase):
    student: Optional[StudentInfo] = None

class UserMeResponseWrapper(BaseModel):
    user: UserMeResponse

class UserUpdateInput(BaseModel):
    fullName: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    instagram: Optional[str] = None
    avatarUrl: Optional[str] = None
