from fastapi import APIRouter, Depends
from app.schemas.role_schema import RoleResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.role_controller import get_role_by_id
from app.config.db_config import get_db

router = APIRouter(tags=["roles"])

@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(role_id: int, db: AsyncSession = Depends(get_db)) -> RoleResponse:
    return await get_role_by_id(db, role_id)