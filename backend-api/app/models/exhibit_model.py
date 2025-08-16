from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base

class Exhibit(Base):
    __tablename__ = "exhibits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    subcategory: Mapped[str] = mapped_column(String(100), nullable=False)

    narcotic: Mapped[list["Narcotic"]] = relationship(
        "Narcotic",
        back_populates="exhibit",
        cascade="all, delete-orphan",
        lazy="selectin"
    )