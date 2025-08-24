from pydantic import BaseModel
from typing import Optional

class NarcoticExampleImageBase(BaseModel):
    narcotic_id: Optional[int] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    image_type: Optional[str] = None

class NarcoticExampleImage(NarcoticExampleImageBase):
    id: int

    class Config:
        from_attributes = True