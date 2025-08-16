from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.config.db_config import get_async_db
from app.schemas.district_schema import District
from app.controllers.district_controller import get_districts

router = APIRouter(tags=["geography"])

@router.get(
    "/districts",
    response_model=List[District],
    status_code=status.HTTP_200_OK,
    summary="ดึงข้อมูลอำเภอ",
    description="ดึงข้อมูลอำเภอทั้งหมด หรือคัดกรองจาก ID ของจังหวัด"
)
async def read_districts(
    province_id: Optional[int] = Query(
        default=None,
        description="คัดกรองอำเภอด้วย ID ของจังหวัด"
    ),
    db: AsyncSession = Depends(get_async_db)
) -> List[District]:
    districts = await get_districts(db, province_id)
    if province_id is not None and not districts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ไม่พบข้อมูลอำเภอจาก ID จังหวัดที่ส่งมา: {province_id}"
        )
    return districts