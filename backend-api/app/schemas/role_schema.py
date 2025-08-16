from pydantic import BaseModel, Field
from typing import Optional

class RoleBase(BaseModel):
    id: int
    role_name: str = Field(..., min_length=1)
    description: Optional[str] = Field(default=None, max_length=255)

class RoleResponse(RoleBase):
    id: int
    class Config:
        from_attributes = True