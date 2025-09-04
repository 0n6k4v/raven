from __future__ import annotations
from typing import Optional, Annotated
from pydantic import BaseModel, Field, ConfigDict

class FirearmAmmunitionBase(BaseModel):
    firearm_id: Annotated[int, Field(..., gt=0, description="ID of the firearm")]
    ammunition_id: Annotated[int, Field(..., gt=0, description="ID of the ammunition")]

    model_config = ConfigDict(extra="forbid")

class FirearmAmmunitionCreate(FirearmAmmunitionBase):

class FirearmAmmunitionRead(FirearmAmmunitionBase):
    model_config = ConfigDict(from_attributes=True, extra="ignore")