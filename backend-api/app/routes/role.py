from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.role_schema import RoleResponse
from app.controllers.role_controller import get_all_roles, get_role_by_id
from app.config.db_config import get_async_db

router = APIRouter(tags=["roles"])

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_async_db)):
    return await get_all_roles(db, skip=skip, limit=limit)

@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(role_id: int, db: AsyncSession = Depends(get_async_db)) -> RoleResponse:
    return await get_role_by_id(db, role_id)