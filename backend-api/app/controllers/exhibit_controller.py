from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional
from sqlalchemy.future import select
from app.models.exhibit_model import Exhibit

class ExhibitController:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_exhibit(self, exhibit_data: Dict[str, Any]) -> Optional[Dict]:
        new_exhibit = Exhibit(**exhibit_data)
        self.db.add(new_exhibit)
        await self.db.flush()
        await self.db.commit()
        await self.db.refresh(new_exhibit)

        return await self.get_exhibit_by_id(new_exhibit.id)

    async def get_exhibit_by_id(self, exhibit_id: int) -> Optional[Dict]:
        result = await self.db.execute(
            select(Exhibit).filter(Exhibit.id == exhibit_id)
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