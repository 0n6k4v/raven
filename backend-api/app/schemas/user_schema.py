from pydantic import BaseModel, EmailStr
from typing import Optional
from app.schemas.role_schema import RoleBase

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

# class PaginatedUserResponse(BaseModel):
#     users: List[User]
#     total: int
#     page: int
#     limit: int
#     total_pages: int

#     class Config:
#         from_attributes = True