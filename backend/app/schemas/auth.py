import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    fullName: str
    enrollmentNo: str
    branch: str
    year: int = Field(default=1, ge=1, le=5)
    batch: str
    referralCode: Optional[str] = None  # Referral code of the referrer
    skills: Optional[str] = ""
    bio: Optional[str] = ""
    photo: Optional[str] = None  # Base64 string for photo upload

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class AuthUserSummary(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: str
    avatar: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    user: AuthUserSummary
    message: Optional[str] = None
