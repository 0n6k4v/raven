from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from sqlalchemy import select, func
from app.models.province_model import Province
import json

async def get_provinces(db: AsyncSession) -> List[Dict[str, Any]]:
    query = (
        select(
            Province,
            func.ST_AsGeoJSON(Province.geom).label("geometry_json")
        )
        .order_by(Province.province_name)
    )
    result = await db.execute(query)
    rows = result.all()

    provinces_data = []
    for province, geometry_json in rows:
        province_dict = province.to_dict()
        if geometry_json:
            try:
                province_dict["geometry"] = json.loads(geometry_json)
            except json.JSONDecodeError:
                province_dict["geometry"] = None
        provinces_data.append(province_dict)

    return provinces_data
