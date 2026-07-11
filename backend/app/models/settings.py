from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base

class SettingsModel(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, default="string", nullable=False)  # 'string', 'int', 'bool', 'float', 'json'
    description: Mapped[str] = mapped_column(String, nullable=True)
