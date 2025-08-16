import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional
from app.models.subdistrict_model import Subdistrict
from app.models.district_model import District

async def get_subdistricts(
    db: AsyncSession,
    district_id: Optional[int] = None,
    province_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    query = select(Subdistrict).options(
        selectinload(Subdistrict.district).selectinload(District.province)
    )

    if district_id is not None:
        query = query.where(Subdistrict.district_id == district_id)
    elif province_id is not None:
        query = query.join(District).where(District.province_id == province_id)

    query = query.order_by(
        Subdistrict.district_id,
        Subdistrict.subdistrict_name
    )

    result = await db.execute(query)
    subdistricts = result.scalars().all()

    subdistricts_data = []

    subdistrict_ids_with_geom = [s.id for s in subdistricts if s.geom]
    geom_map = {}
    if subdistrict_ids_with_geom:
        geom_query = select(
            Subdistrict.id,
            func.ST_AsGeoJSON(Subdistrict.geom)
        ).where(Subdistrict.id.in_(subdistrict_ids_with_geom))
        geom_result = await db.execute(geom_query)
        for sid, geom_json in geom_result.all():
            try:
                geom_map[sid] = json.loads(geom_json) if geom_json else None
            except json.JSONDecodeError:
                geom_map[sid] = None

    for subdistrict in subdistricts:
        subdistrict_dict = subdistrict.to_dict()
        if subdistrict.geom:
            subdistrict_dict["geometry"] = geom_map.get(subdistrict.id)
        subdistricts_data.append(subdistrict_dict)

    return subdistricts_data