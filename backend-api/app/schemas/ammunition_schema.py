from __future__ import annotations
from typing import Optional, Annotated
from pydantic import BaseModel, Field, ConfigDict


class AmmunitionBase(BaseModel):
    caliber: Annotated[
        str,
        Field(..., max_length=50, description="Caliber string (e.g. '9 มม.', '.45 ACP')"),
    ]
    type: Annotated[
        Optional[str],
        Field(None, max_length=100, description="Type or classification (e.g. 'ปืนพก')"),
    ]
    description: Annotated[
        Optional[str],
        Field(None, description="Optional textual description"),
    ]

    model_config = ConfigDict(extra="forbid")


class AmmunitionCreate(AmmunitionBase):


class AmmunitionUpdate(BaseModel):
    caliber: Annotated[Optional[str], Field(None, max_length=50)]
    type: Annotated[Optional[str], Field(None, max_length=100)]
    description: Annotated[Optional[str], Field(None)]

    model_config = ConfigDict(extra="forbid")


class AmmunitionRead(AmmunitionBase):
    id: int

    model_config = ConfigDict(from_attributes=True, extra="ignore")