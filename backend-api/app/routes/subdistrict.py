from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.config.db_config import get_async_db
from app.schemas.subdistrict_schema import Subdistrict
from app.controllers.subdistrict_controller import get_subdistricts

router = APIRouter(tags=["geography"])

@router.get(
    "/subdistricts",
    response_model=list[Subdistrict],
    status_code=status.HTTP_200_OK,
    summary="ดีงข้อมูลตำบล",
    description="ดึงข้อมูลตำบลทั้งหมดจาก Database หรือคัดกรองจาก ID ของอำเภอ หรือจังหวัด"
)
async def read_subdistricts(
    district_id: Optional[int] = Query(None, description="คัดกรองตำบลด้วย ID ของอำเภอ"),
    province_id: Optional[int] = Query(None, description="คัดกรองตำบลด้วย ID ของจังหวัด"),
    db: AsyncSession = Depends(get_async_db)
) -> list[Subdistrict]:
    subdistricts = await get_subdistricts(db, district_id, province_id)
    if (district_id or province_id) and not subdistricts:
        filters = []
        if district_id:
            filters.append(f"ID ของอำเภอ: {district_id}")
        if province_id:
            filters.append(f"ID ของจังหวัด: {province_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ไม่พบข้อมูลตำบลสำหรับ {' และ '.join(filters)}"
        )
    return subdistricts
