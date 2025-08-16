from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any

class ProvinceBase(BaseModel):
    id: int
    province_name: str
    geometry: Optional[Dict[str, Any]] = None

class Province(ProvinceBase):
    model_config = ConfigDict(from_attributes=True)
