from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from app.schemas.exhibit_schema import Exhibit
from app.schemas.drug_form_schema import DrugForm
from app.schemas.narcotic_example_image_schema import NarcoticExampleImage
from app.schemas.narcotics_pill_schema import NarcoticPill

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

    class Config:
        from_attributes = True

class NarcoticWithRelations(Narcotic):
    exhibit: Optional[Exhibit] = None
    drug_form: Optional[DrugForm] = None
    example_images: List[NarcoticExampleImage] = Field(default_factory=list)
    pill_info: Optional[NarcoticPill] = None

    class Config:
        from_attributes = True