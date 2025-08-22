from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class UserPermissionBase(BaseModel):
    permission_type: str
    granted: bool = True
    
    class Config:
        from_attributes = True

class UserPermissionResponse(UserPermissionBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True