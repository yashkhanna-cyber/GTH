import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="Student", nullable=False, index=True)  # 'Student' or 'Admin'
    department: Mapped[str] = mapped_column(String, nullable=True)
    team: Mapped[str] = mapped_column(String, nullable=True)  # Keeps string team name for frontend compatibility
    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    photo: Mapped[str] = mapped_column(String, nullable=True)
    total_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    referral_code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    
    enrollment_no: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=True)
    branch: Mapped[str] = mapped_column(String, nullable=True)
    year: Mapped[int] = mapped_column(Integer, default=1, nullable=True)
    batch: Mapped[str] = mapped_column(String, nullable=True)
    bio: Mapped[str] = mapped_column(String, nullable=True)
    skills: Mapped[str] = mapped_column(String, nullable=True)
    linkedin: Mapped[str] = mapped_column(String, nullable=True)
    github: Mapped[str] = mapped_column(String, nullable=True)
    instagram: Mapped[str] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    team_rel = relationship("Team", foreign_keys=[team_id], back_populates="members")
    led_team = relationship("Team", foreign_keys="[Team.leader_id]", back_populates="leader")
    submissions = relationship("TaskSubmission", back_populates="student", cascade="all, delete-orphan")
    points_history = relationship("PointsHistory", foreign_keys="[PointsHistory.student_id]", back_populates="student", cascade="all, delete-orphan")
    given_points = relationship("PointsHistory", foreign_keys="[PointsHistory.given_by]", back_populates="giver")
    notifications = relationship("Notification", back_populates="student", cascade="all, delete-orphan")
    attendance = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    referrals_made = relationship("Referral", foreign_keys="[Referral.referrer_student]", back_populates="referrer", cascade="all, delete-orphan")
    referred_by = relationship("Referral", foreign_keys="[Referral.new_student]", back_populates="new_user", cascade="all, delete-orphan")
    invitations = relationship("TeamInvitation", back_populates="student", cascade="all, delete-orphan")
    uploads = relationship("FileUpload", back_populates="uploader")
    audit_logs = relationship("AuditLog", back_populates="user")
