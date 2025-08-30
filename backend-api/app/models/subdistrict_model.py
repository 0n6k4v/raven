from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from geoalchemy2 import Geometry
from app.models.base import Base
from app.models.district_model import District
from typing import Any

class Subdistrict(Base):
    __tablename__ = "subdistricts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    subdistrict_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id"), nullable=False)
    perimeter: Mapped[float] = mapped_column(Float)
    area_sqkm: Mapped[float] = mapped_column(Float)
    geom: Mapped[Any] = mapped_column(Geometry('MULTIPOLYGON'), nullable=True)

    # Relationships
    district: Mapped["District"] = relationship("District", back_populates="subdistricts", lazy="joined")
    histories = relationship("History", back_populates="subdistrict")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "subdistrict_name": self.subdistrict_name,
            "district_id": self.district_id,
            "district_name": getattr(self.district, "district_name", None),
            "province_id": getattr(self.district, "province_id", None),
            "province_name": getattr(getattr(self.district, "province", None), "province_name", None),
            "perimeter": float(self.perimeter) if self.perimeter is not None else None,
            "area_sqkm": float(self.area_sqkm) if self.area_sqkm is not None else None,
            "geometry": None
        }