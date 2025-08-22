from fastapi import APIRouter, Cookie, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.user_schema import User, PaginatedUserResponse, UserResponse
from app.controllers.auth_controller import get_current_active_user_from_cookie
from app.controllers.user_controller import get_all_users, get_user_by_user_id
from app.config.db_config import get_db, get_async_db

router = APIRouter()

async def get_user(
    access_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    return await get_current_active_user_from_cookie(access_token, db)

@router.get("/me", response_model=User)
async def read_users_me(user: User = Depends(get_user)):
    return user

@router.get("/me/items")
async def read_own_items(user: User = Depends(get_user)):
    return [{"item_id": "Foo", "owner": user.email}]

@router.get("/users/list", response_model=PaginatedUserResponse)
async def list_users(
    page: int = Query(1, description="จำนวนหน้า"),
    limit: int = Query(10, description="จำนวนรายการต่อหน้า"),
    search: Optional[str] = Query(None, description="คำค้นหา"),
    role_id: Optional[int] = Query(None, description="กรองจาก Role ID"),
    db: AsyncSession = Depends(get_async_db)
):
    skip = (page - 1) * limit
    users = await get_all_users(db, skip=skip, limit=limit, search=search, role_id=role_id)
    total_count = len(users) if page == 1 else await get_all_users(db, count_only=True, search=search, role_id=role_id)
    total_pages = (total_count + limit - 1) // limit
    return {
        "users": users,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_async_db)):
    return await get_user_by_user_id(db, user_id=user_id)