from sqlalchemy import Integer, String, Float
from sqlalchemy.orm import relationship, Mapped, mapped_column
from geoalchemy2 import Geometry
from app.models.base import Base
from typing import Any

class Province(Base):
    __tablename__ = "provinces"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    province_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    reg_nesdb: Mapped[str] = mapped_column(String, nullable=True)
    reg_royin: Mapped[str] = mapped_column(String, nullable=True)
    perimeter: Mapped[float] = mapped_column(Float, nullable=True)
    area_sqkm: Mapped[float] = mapped_column(Float, nullable=True)
    geom: Mapped[Any] = mapped_column(Geometry('MULTIPOLYGON'), nullable=True)
    
    # Relationships
    districts: Mapped[list["District"]] = relationship("District", back_populates="province", lazy="selectin")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "province_name": self.province_name,
            "reg_nesdb": self.reg_nesdb,
            "reg_royin": self.reg_royin,
            "perimeter": float(self.perimeter) if self.perimeter is not None else None,
            "area_sqkm": float(self.area_sqkm) if self.area_sqkm is not None else None,
            "geometry": None
        }