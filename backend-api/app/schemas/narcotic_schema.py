from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal

class NarcoticBase(BaseModel):
    exhibit_id: Optional[int] = None
    form_id: Optional[int] = None
    characteristics: Optional[str] = None
    drug_type: Optional[str] = None
    drug_category: Optional[str] = None
    consumption_method: Optional[str] = None
    effect: Optional[str] = None
    weight_grams: Optional[Decimal] = None

class Narcotic(NarcoticBase):
    id: int
    exhibit: Optional["Exhibit"] = None

    class Config:
        from_attributes = True

class NarcoticWithRelations(Narcotic):
    exhibit: Optional["Exhibit"] = None
    drug_form: Optional["DrugForm"] = None
    example_images: List["NarcoticExampleImage"] = Field(default_factory=list)
    pill_info: Optional["NarcoticPill"] = None

    class Config:
        from_attributes = True

try:
    Narcotic.model_rebuild()
    NarcoticWithRelations.model_rebuild()
except Exception:
    pass