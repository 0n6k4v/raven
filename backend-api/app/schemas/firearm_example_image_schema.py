from __future__ import annotations
from typing import Optional, Annotated
from pydantic import BaseModel, Field, ConfigDict


class FirearmExampleImageBase(BaseModel):
    firearm_id: Annotated[int, Field(..., gt=0, description="ID of the firearm (FK)")]
    image_url: Annotated[str, Field(..., max_length=2000, description="URL to example image")]
    description: Annotated[Optional[str], Field(None, description="Optional description of the image")]
    priority: Annotated[Optional[int], Field(0, ge=0, description="Priority ordering (0 = default)")] = 0

    model_config = ConfigDict(extra="forbid")


class FirearmExampleImageCreate(FirearmExampleImageBase):
    pass


class FirearmExampleImageUpdate(BaseModel):
    image_url: Annotated[Optional[str], Field(None, max_length=2000)]
    description: Annotated[Optional[str], Field(None)]
    priority: Annotated[Optional[int], Field(None, ge=0)]

    model_config = ConfigDict(extra="forbid")


class FirearmExampleImageRead(FirearmExampleImageBase):
    id: int

    model_config = ConfigDict(from_attributes=True, extra="ignore")