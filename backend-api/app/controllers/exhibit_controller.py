from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional
from sqlalchemy.future import select
from app.models.exhibit_model import Exhibit

async def create_exhibit(db: AsyncSession, exhibit_data: Dict[str, Any], firearm_data: Optional[Dict[str, Any]] = None) -> Dict:
    new_exhibit = Exhibit(**exhibit_data)
    db.add(new_exhibit)
    await db.flush()
    await db.commit()
    await db.refresh(new_exhibit)
    
    return await get_exhibit_by_id(db, new_exhibit.id)

async def get_exhibit_by_id(db: AsyncSession, exhibit_id: int) -> Optional[Dict]:
    result = await db.execute(
        select(Exhibit)
        .filter(Exhibit.id == exhibit_id)
    )
    
    exhibit = result.unique().scalars().first()
    if not exhibit:
        return None
        
    exhibit_dict = {
        'id': exhibit.id,
        'category': exhibit.category,
        'subcategory': exhibit.subcategory,
    }
        
    return exhibit_dict