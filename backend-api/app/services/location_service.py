from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.models.subdistrict_model import Subdistrict
from app.models.district_model import District
from app.models.province_model import Province

async def get_location_names(db: AsyncSession, subdistrict_id: Optional[int]) -> Dict[str, Optional[str]]:
    location_info: Dict[str, Optional[str]] = {
        "province_name": None,
        "district_name": None,
        "subdistrict_name": None
    }

    if not subdistrict_id:
        return location_info

    try:
        stmt = select(Subdistrict).options(
            joinedload(Subdistrict.district).joinedload(District.province)
        ).where(Subdistrict.id == subdistrict_id)

        result = await db.execute(stmt)
        sub = result.scalar_one_or_none()

        if not sub:
            return location_info

        location_info["subdistrict_name"] = getattr(sub, "subdistrict_name", None)
        district = getattr(sub, "district", None)
        if district:
            location_info["district_name"] = getattr(district, "district_name", None)
            province = getattr(district, "province", None)
            if province:
                location_info["province_name"] = getattr(province, "province_name", None)

    except Exception:
        pass

    return location_info