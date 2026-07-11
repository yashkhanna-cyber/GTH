import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel

class AttendanceRecordResponse(BaseModel):
    id: uuid.UUID
    date: str  # Formatted as "Long Month Day, Year" e.g. "October 15, 2026"
    day: str   # e.g. "Session 1"
    status: str  # 'PRESENT' or 'ABSENT'
    time: str  # Formatted as "HH:MM AM/PM"

class AttendanceSummaryResponse(BaseModel):
    success: bool
    attendance: List[AttendanceRecordResponse]
    presentCount: int
    absentCount: int
    totalCount: int
    rate: int

class AdminAttendanceUpdateInput(BaseModel):
    studentId: uuid.UUID
    date: date
    status: str  # 'PRESENT' or 'ABSENT'

class AdminAttendanceListResponse(BaseModel):
    id: uuid.UUID
    studentId: uuid.UUID
    studentName: str
    enrollmentNo: str
    date: date
    status: str
    createdAt: datetime
