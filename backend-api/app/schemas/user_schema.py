from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.schemas.role_schema import RoleBase
from app.schemas.user_permission_schema import UserPermissionResponse

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class User(BaseModel):
    id: int
    user_id: str
    title: Optional[str] = None
    firstname: str
    lastname: str
    email: EmailStr
    department: Optional[str] = None
    profile_image_url: Optional[str] = None
    role: Optional[RoleBase] = None

    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class UserBase(BaseModel):
    title: Optional[str] = None
    firstname: str
    lastname: str
    email: EmailStr
    department: Optional[str] = None
    profile_image_url: Optional[str] = None

class PaginatedUserResponse(BaseModel):
    users: List[User]
    total: int
    page: int
    limit: int
    total_pages: int

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    user_id: str
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    role: Optional[RoleBase] = None
    permissions: Optional[List[UserPermissionResponse]] = None

    class Config:
        from_attributes = True