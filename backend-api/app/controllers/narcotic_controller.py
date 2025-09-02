from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
from app.models.narcotic_model import Narcotic, NarcoticPill, NarcoticExampleImage, NarcoticImageVector
from app.schemas.narcotic_example_image_schema import NarcoticExampleImageBase
from sqlalchemy.orm import joinedload
from sqlalchemy import select, or_, delete, update

class NarcoticController:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_pill_info(self, narcotic_id: int, pill_info: Any):
        narcotic_exists = await self.db.execute(select(Narcotic).filter(Narcotic.id == narcotic_id))

        if not narcotic_exists.scalars().first():
            return None
        if hasattr(pill_info, "model_dump"):
            payload = pill_info.model_dump()
        elif hasattr(pill_info, "dict"):
            payload = pill_info.dict()
        else:
            payload = dict(pill_info or {})

        result = await self.db.execute(
            select(NarcoticPill).filter(NarcoticPill.narcotic_id == narcotic_id)
        )
        existing_pill = result.scalars().first()

        if existing_pill:
            update_data = {k: v for k, v in payload.items() if k != "narcotic_id" and v is not None}
            if update_data:
                await self.db.execute(
                    update(NarcoticPill)
                    .where(NarcoticPill.narcotic_id == narcotic_id)
                    .values(**update_data)
                )
                await self.db.commit()
                refreshed = await self.db.execute(
                    select(NarcoticPill).filter(NarcoticPill.narcotic_id == narcotic_id)
                )
                return refreshed.scalars().first()
            return existing_pill
        else:
            payload["narcotic_id"] = int(narcotic_id)
            new_pill = NarcoticPill(**payload)
            self.db.add(new_pill)
            try:
                await self.db.commit()
                await self.db.refresh(new_pill)
                return new_pill
            except Exception:
                await self.db.rollback()
                raise

    async def add_example_image(self, image: NarcoticExampleImageBase) -> NarcoticExampleImage:
        db_image = NarcoticExampleImage(**image.model_dump())
        self.db.add(db_image)
        await self.db.commit()
        await self.db.refresh(db_image)
        return db_image

    async def add_image_vector(self, narcotic_id: int, image_id: int, vector_data: List[float]):
        db_vector = NarcoticImageVector(
            narcotic_id=int(narcotic_id),
            image_id=int(image_id),
            image_vector=vector_data
        )
        self.db.add(db_vector)
        await self.db.commit()
        await self.db.refresh(db_vector)
        return db_vector

    async def get_narcotic(self, narcotic_id: int) -> Optional[Narcotic]:
        result = await self.db.execute(select(Narcotic).filter(Narcotic.id == narcotic_id))
        return result.scalars().first()

    async def get_narcotics(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        drug_category: Optional[str] = None,
        drug_type: Optional[str] = None,
        form_id: Optional[int] = None,
        include_relations: bool = True
    ) -> List[Narcotic]:
        query = select(Narcotic)

        if include_relations:
            query = query.options(
                joinedload(Narcotic.exhibit),
                joinedload(Narcotic.example_images),
                joinedload(Narcotic.example_images).joinedload(NarcoticExampleImage.image_vectors),
                joinedload(Narcotic.drug_form),
                joinedload(Narcotic.pill_info)
            )

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Narcotic.drug_type.ilike(search_term),
                    Narcotic.drug_category.ilike(search_term),
                    Narcotic.characteristics.ilike(search_term)
                )
            )

        if drug_category:
            query = query.filter(Narcotic.drug_category == drug_category)

        if drug_type:
            query = query.filter(Narcotic.drug_type == drug_type)

        if form_id:
            query = query.filter(Narcotic.form_id == form_id)

        query = query.offset(skip).limit(limit)

        result = await self.db.execute(query)
        return result.scalars().unique().all()

    async def get_narcotic_with_relations(self, narcotic_id: int) -> Optional[Narcotic]:
        result = await self.db.execute(
            select(Narcotic).options(
                joinedload(Narcotic.exhibit),
                joinedload(Narcotic.drug_form),
                joinedload(Narcotic.example_images).joinedload(NarcoticExampleImage.image_vectors),
                joinedload(Narcotic.pill_info)
            ).filter(Narcotic.id == narcotic_id)
        )
        return result.scalars().first()

    async def delete_narcotic(self, narcotic_id: int) -> bool:
        db_narcotic = await self.get_narcotic(narcotic_id)
        if db_narcotic:
            await self.db.execute(delete(Narcotic).where(Narcotic.id == narcotic_id))
            await self.db.commit()
            return True
        return False