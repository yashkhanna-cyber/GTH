import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Team(Base):
    __tablename__ = "teams"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    team_name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    mentor: Mapped[str] = mapped_column(String, nullable=True)
    tagline: Mapped[str] = mapped_column(String, nullable=True)
    leader_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    leader = relationship("User", foreign_keys=[leader_id], back_populates="led_team")
    members = relationship("User", foreign_keys="[User.team_id]", back_populates="team_rel")
    invitations = relationship("TeamInvitation", back_populates="team", cascade="all, delete-orphan")

class TeamInvitation(Base):
    __tablename__ = "team_invitations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="PENDING", nullable=False)  # 'PENDING', 'ACCEPTED', 'REJECTED'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    team = relationship("Team", back_populates="invitations")
    student = relationship("User", back_populates="invitations")

    __table_args__ = (
        UniqueConstraint("team_id", "student_id", name="uq_team_student_invitation"),
    )
