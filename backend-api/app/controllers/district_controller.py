import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional
from app.models.district_model import District

async def get_districts(db: AsyncSession, province_id: Optional[int] = None) -> List[Dict[str, Any]]:
    query = select(District).options(selectinload(District.province))
    if province_id is not None:
        query = query.where(District.province_id == province_id)
    query = query.order_by(District.province_id, District.district_name)

    result = await db.execute(query)
    districts = result.scalars().all()

    if not districts:
        return []

    district_ids_with_geom = [d.id for d in districts if d.geom]
    geom_map = {}
    if district_ids_with_geom:
        geom_query = (
            select(District.id, func.ST_AsGeoJSON(District.geom))
            .where(District.id.in_(district_ids_with_geom))
        )
        geom_result = await db.execute(geom_query)
        for district_id, geom_json in geom_result.all():
            try:
                geom_map[district_id] = json.loads(geom_json) if geom_json else None
            except json.JSONDecodeError:
                geom_map[district_id] = None

    districts_data = []
    for district in districts:
        district_dict = district.to_dict()
        if district.geom:
            district_dict["geometry"] = geom_map.get(district.id)
        districts_data.append(district_dict)

    return districts_data