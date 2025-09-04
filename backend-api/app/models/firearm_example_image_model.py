from __future__ import annotations

from typing import Optional

from sqlalchemy import Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FirearmExampleImage(Base):
    __tablename__ = "firearms_example_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    firearm_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("firearms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)

    # relationship back to Firearm (Firearm model should define example_images back_populates)
    firearm: Mapped["Firearm"] = relationship(
        "Firearm",
        back_populates="example_images",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<FirearmExampleImage id={self.id} firearm_id={self.firearm_id} priority={self.priority}>"