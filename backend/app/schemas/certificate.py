import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class CertificateTemplateCreateInput(BaseModel):
    title: str
    description: str
    requiredXp: int

class CertificateResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    requiredXp: int
    unlocked: bool
    date: str  # Formatted date string

class StudentCertificatesListResponse(BaseModel):
    success: bool
    studentName: str
    studentPoints: int
    certificates: List[CertificateResponse]

class CertificateTemplateResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    requiredXp: int
    createdAt: datetime

    class Config:
        from_attributes = True
