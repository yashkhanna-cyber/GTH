import uuid
from datetime import datetime
from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    referrer_student: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    new_student: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    points_awarded: Mapped[int] = mapped_column(Integer, default=250, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    referrer = relationship("User", foreign_keys=[referrer_student], back_populates="referrals_made")
    new_user = relationship("User", foreign_keys=[new_student], back_populates="referred_by")

    __table_args__ = (
        UniqueConstraint("new_student", name="uq_new_student_referral"),
    )
