import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    rules: Mapped[str] = mapped_column(String, nullable=True)
    points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reference_file: Mapped[str] = mapped_column(String, nullable=True)
    assigned_to: Mapped[str] = mapped_column(String, default="ALL", nullable=False)  # 'ALL', 'BATCH', 'TEAM'
    assigned_target: Mapped[str] = mapped_column(String, nullable=True)  # Specific batch or team
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    submissions = relationship("TaskSubmission", back_populates="task", cascade="all, delete-orphan")

class TaskSubmission(Base):
    __tablename__ = "task_submissions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    uploaded_file: Mapped[str] = mapped_column(String, nullable=False)  # Stores public file URL or local path
    file_upload_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("file_uploads.id", ondelete="SET NULL"), nullable=True)
    comment: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="PENDING", nullable=False)  # 'PENDING', 'APPROVED', 'REJECTED'
    review_comment: Mapped[str] = mapped_column(String, nullable=True)
    points_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    student = relationship("User", back_populates="submissions")
    task = relationship("Task", back_populates="submissions")
    file_upload = relationship("FileUpload")

    __table_args__ = (
        # A student can submit a task only once, but they can update/overwrite it.
        # Wait, the current JS allows overwriting by deleting/inserting or replacing. We can make it unique.
        UniqueConstraint("student_id", "task_id", name="uq_student_task_submission"),
    )
