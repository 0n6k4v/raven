from typing import List
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class DrugForm(Base):
    __tablename__ = "drug_forms"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    narcotics: Mapped[List["Narcotic"]] = relationship(
        "Narcotic",
        back_populates="drug_form",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<DrugForm(id={self.id!r}, name={self.name!r})>"