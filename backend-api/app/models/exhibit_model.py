from __future__ import annotations

from typing import List, Optional

from sqlalchemy import Integer, String, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Exhibit(Base):
    __tablename__ = "exhibits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    subcategory: Mapped[Optional[str]] = mapped_column(String(100))

    # Relationships
    narcotics: Mapped[List["Narcotic"]] = relationship(
        "Narcotic",
        back_populates="exhibit",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    firearms: Mapped[List["Firearm"]] = relationship(
        "Firearm",
        back_populates="exhibit",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    histories: Mapped[List["History"]] = relationship(
        "History",
        back_populates="exhibit",
        lazy="selectin",
    )

    __table_args__ = (Index("ix_exhibits_id", "id"),)

    def __repr__(self) -> str:
        return f"<Exhibit id={self.id} category={self.category!r} subcategory={self.subcategory!r}>"