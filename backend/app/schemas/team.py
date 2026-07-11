import uuid
from typing import List, Optional
from pydantic import BaseModel

class TeamCreateInput(BaseModel):
    teamName: str
    tagline: str
    invitedStudentIds: List[uuid.UUID]

class TeamInviteActionInput(BaseModel):
    inviteId: uuid.UUID
    action: str  # 'ACCEPT' or 'DECLINE'

class TeamMemberResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    photo: Optional[str] = None
    enrollmentNo: Optional[str] = ""
    branch: Optional[str] = ""
    batch: Optional[str] = ""
    points: int = 0
    role: str  # 'Leader' or 'Member'

class TeamDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    tagline: str
    mentor: Optional[str] = None
    leaderId: Optional[uuid.UUID] = None
    members: List[TeamMemberResponse]
    totalPoints: int
    rank: int
    totalTeams: int

class TeamInvitationResponse(BaseModel):
    id: uuid.UUID
    teamId: uuid.UUID
    teamName: str
    tagline: str
    leaderName: str

class EligibleMemberResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    enrollmentNo: Optional[str] = ""
    branch: Optional[str] = ""
    batch: Optional[str] = ""

class TeamStatusResponse(BaseModel):
    success: bool
    inTeam: bool
    team: Optional[TeamDetailResponse] = None
    pendingInvitations: Optional[List[TeamInvitationResponse]] = None
    eligibleMembers: Optional[List[EligibleMemberResponse]] = None
