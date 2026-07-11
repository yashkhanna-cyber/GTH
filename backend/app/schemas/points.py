import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AwardedByInfo(BaseModel):
    name: str

class PointsHistoryResponse(BaseModel):
    id: uuid.UUID
    points: int
    reason: str
    createdAt: datetime
    awardedBy: AwardedByInfo

class AdminPointsAdjustmentInput(BaseModel):
    amount: int
    type: str  # 'ADD' or 'DEDUCT'
    reason: str
