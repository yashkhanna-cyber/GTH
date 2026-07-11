import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class ReferredStudentResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    createdAt: datetime

class ReferralSummaryResponse(BaseModel):
    success: bool
    referralCode: str
    referralCount: int
    referredStudents: List[ReferredStudentResponse]
