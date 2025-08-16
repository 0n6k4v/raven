from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from geoalchemy2 import Geometry
from app.models.base import Base
from typing import Any

class District(Base):
    __tablename__ = "districts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    district_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    province_id: Mapped[int] = mapped_column(ForeignKey("provinces.id"), nullable=False)
    perimeter: Mapped[float] = mapped_column(Float)
    area_sqkm: Mapped[float] = mapped_column(Float)
    geom: Mapped[Any] = mapped_column(Geometry('MULTIPOLYGON'), nullable=True)

    # Relationships
    province: Mapped["Province"] = relationship("Province", back_populates="districts", lazy="joined")
    subdistricts: Mapped[list["Subdistrict"]] = relationship("Subdistrict", back_populates="district", lazy="selectin")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "district_name": self.district_name,
            "province_id": self.province_id,
            "province_name": getattr(self.province, "province_name", None),
            "perimeter": float(self.perimeter) if self.perimeter is not None else None,
            "area_sqkm": float(self.area_sqkm) if self.area_sqkm is not None else None,
            "geometry": None
        }