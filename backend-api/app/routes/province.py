from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.config.db_config import get_async_db
from app.schemas.province_schema import Province
from app.controllers.province_controller import get_provinces

router = APIRouter(tags=["geography"])

@router.get(
    "/provinces",
    response_model=list[Province],
    status_code=status.HTTP_200_OK,
    summary="ดึงข้อมูลจังหวัดทั้งหมด",
    response_description="แสดงรายการจังหวัด"
)
async def read_provinces(db: AsyncSession = Depends(get_async_db)) -> list[Province]:
    provinces = await get_provinces(db)
    if provinces is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบข้อมูลจังหวัด"
        )
    return provinces