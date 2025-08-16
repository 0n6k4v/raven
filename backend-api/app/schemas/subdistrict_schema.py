from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any

class SubdistrictBase(BaseModel):
    id: int
    subdistrict_name: str
    district_id: int
    geometry: Optional[Dict[str, Any]] = None

class Subdistrict(SubdistrictBase):
    model_config = ConfigDict(from_attributes=True)
