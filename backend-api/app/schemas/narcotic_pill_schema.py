from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

class NarcoticPillBase(BaseModel):
    color: Optional[str] = None
    diameter_mm: Optional[Decimal] = None
    thickness_mm: Optional[Decimal] = None
    edge_shape: Optional[str] = None
    
class NarcoticPill(NarcoticPillBase):
    narcotic_id: int
    
    class Config:
        from_attributes = True