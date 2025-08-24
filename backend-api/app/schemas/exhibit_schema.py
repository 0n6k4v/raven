from pydantic import BaseModel
from typing import Optional

class ExhibitBase(BaseModel):
    category: str
    subcategory: str

class ExhibitCreate(ExhibitBase):
    pass

class Exhibit(ExhibitBase):
    id: int
    narcotic: Optional["Narcotic"] = None

    class Config:
        from_attributes = True

try:
    from app.schemas.narcotic_schema import Narcotic
    Exhibit.model_rebuild()
except Exception:
    pass