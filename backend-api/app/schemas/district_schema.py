from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any

class DistrictBase(BaseModel):
    id: int
    district_name: str
    province_id: int
    geometry: Optional[Dict[str, Any]] = None

class District(DistrictBase):
    model_config = ConfigDict(from_attributes=True)
