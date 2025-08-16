from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from app.schemas.narcotic import Narcotic

class ExhibitBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    subcategory: str = Field(..., min_length=1, max_length=100)

class ExhibitCreate(ExhibitBase):
    pass

class ExhibitUpdate(BaseModel):
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    subcategory: Optional[str] = Field(default=None, min_length=1, max_length=100)

class Exhibit(ExhibitBase):
    id: int
    narcotic: Optional[Narcotic] = None

    model_config = ConfigDict(from_attributes=True)