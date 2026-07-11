import uuid
from datetime import datetime
from typing import List
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
    required_xp: int
    createdAt: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class CertificateTemplateListResponse(BaseModel):
    success: bool = True
    certificates: List[CertificateTemplateResponse]
