from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, Annotated, List

from .firearm_example_image_schema import FirearmExampleImageRead

class FirearmBase(BaseModel):
    mechanism: Annotated[
        str,
        Field(..., max_length=100, description="Operating mechanism (e.g. semi-auto, revolver, pump)")
    ]
    brand: Annotated[
        str,
        Field(..., max_length=100, description="Manufacturer / brand name")
    ]
    series: Annotated[
        Optional[str],
        Field(None, max_length=100, description="Series or family name (optional)")
    ]
    model: Annotated[
        Optional[str],
        Field(None, max_length=100, description="Model name (optional)")
    ]
    normalized_name: Annotated[
        Optional[str],
        Field(None, max_length=255, description="Normalized name (lowercase, alphanumeric) used for indexing/search")
    ]

    model_config = ConfigDict(extra="forbid")

class FirearmCreate(FirearmBase):
    @model_validator(mode="before")
    def _populate_normalized(cls, values: dict) -> dict:
        if not values.get("normalized_name"):
            brand = values.get("brand") or ""
            series = values.get("series") or ""
            model = values.get("model") or ""
            combined = f"{brand}{series}{model}"
            normalized = "".join(ch.lower() for ch in combined if ch.isalnum())
            values["normalized_name"] = normalized or None
        return values

class FirearmUpdate(BaseModel):
    mechanism: Annotated[Optional[str], Field(None, max_length=100)]
    brand: Annotated[Optional[str], Field(None, max_length=100)]
    series: Annotated[Optional[str], Field(None, max_length=100)]
    model: Annotated[Optional[str], Field(None, max_length=100)]
    normalized_name: Annotated[Optional[str], Field(None, max_length=255)]

    model_config = ConfigDict(extra="forbid")

class FirearmRead(FirearmBase):
    id: int
    exhibit_id: Optional[int] = None
    example_images: List[FirearmExampleImageRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, extra="ignore")