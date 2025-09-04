from __future__ import annotations

from typing import Optional

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FirearmAmmunition(Base):
    __tablename__ = "firearm_ammunitions"

    firearm_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("firearms.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
        index=True,
    )
    ammunition_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ammunitions.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
        index=True,
    )

    firearm: Mapped["Firearm"] = relationship(
        "Firearm",
        back_populates="ammunitions_link",
        passive_deletes=True,
    )
    ammunition: Mapped["Ammunition"] = relationship(
        "Ammunition",
        back_populates="firearms_link",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<FirearmAmmunition firearm_id={self.firearm_id} ammunition_id={self.ammunition_id}>"