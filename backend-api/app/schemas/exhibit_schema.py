from pydantic import BaseModel
from typing import Optional

class ExhibitBase(BaseModel):
    category: str
    subcategory: str

class Exhibit(ExhibitBase):
    id: int

    class Config:
        from_attributes = True