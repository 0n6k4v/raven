from __future__ import annotations

from typing import Optional, List

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Ammunition(Base):
    __tablename__ = "ammunitions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    caliber: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)

    firearms_link: Mapped[List["FirearmAmmunition"]] = relationship(
        "FirearmAmmunition",
        back_populates="ammunition",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Ammunition id={self.id} caliber={self.caliber!r} type={self.type!r}>"