from __future__ import annotations

from typing import Optional, List

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

class Firearm(Base):
    __tablename__ = "firearms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)

    exhibit_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("exhibits.id", ondelete="CASCADE"), nullable=True, index=True)
    exhibit: Mapped[Optional["Exhibit"]] = relationship("Exhibit", back_populates="firearms", passive_deletes=True)

    mechanism: Mapped[str] = mapped_column(String(100), nullable=False)
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    series: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    normalized_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    ammunitions_link: Mapped[List["FirearmAmmunition"]] = relationship(
        "FirearmAmmunition",
        back_populates="firearm",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    example_images: Mapped[List["FirearmExampleImage"]] = relationship(
        "FirearmExampleImage",
        back_populates="firearm",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Firearm id={self.id} brand={self.brand!r} model={self.model!r}>"