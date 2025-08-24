from sqlalchemy import Integer, String, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base
from typing import List

class Exhibit(Base):
    __tablename__ = "exhibits"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str | None] = mapped_column(String(100))
    subcategory: Mapped[str | None] = mapped_column(String(100))

    narcotics: Mapped[List["Narcotic"]] = relationship(
        "Narcotic",
        back_populates="exhibit",
        lazy="selectin",
        cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_exhibits_id", "id"),)