from __future__ import annotations

from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

class Firearm(Base):
    __tablename__ = "firearms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    exhibit_id: Mapped[int] = mapped_column(Integer, ForeignKey("exhibits.id", ondelete="CASCADE"), nullable=False, index=True)
    exhibit: Mapped["Exhibit"] = relationship("Exhibit", back_populates="firearms", passive_deletes=True)

    mechanism: Mapped[str] = mapped_column(String(100), nullable=False)
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    series: Mapped[Optional[str]] = mapped_column(String(100))
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    normalized_name: Mapped[Optional[str]] = mapped_column(Text)

    def __repr__(self) -> str:
        return f"<Firearm id={self.id} brand={self.brand!r} model={self.model!r}>"