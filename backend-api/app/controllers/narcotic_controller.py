from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.models.narcotic_model import Narcotic, NarcoticExampleImage
from sqlalchemy.orm import joinedload
from sqlalchemy import select, or_, delete

async def get_narcotics(
    db: AsyncSession, 
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
        
    result = await db.execute(query)
    return result.scalars().unique().all()

async def get_narcotic(db: AsyncSession, narcotic_id: int) -> Optional[Narcotic]:
    result = await db.execute(select(Narcotic).filter(Narcotic.id == narcotic_id))
    return result.scalars().first()

async def get_narcotic_with_relations(db: AsyncSession, narcotic_id: int) -> Optional[Narcotic]:
    result = await db.execute(
        select(Narcotic).options(
            joinedload(Narcotic.exhibit),
            joinedload(Narcotic.drug_form),
            joinedload(Narcotic.example_images).joinedload(NarcoticExampleImage.image_vectors),
            joinedload(Narcotic.pill_info)
        ).filter(Narcotic.id == narcotic_id)
    )
    return result.scalars().first()

async def delete_narcotic(db: AsyncSession, narcotic_id: int) -> bool:
    db_narcotic = await get_narcotic(db, narcotic_id)
    if db_narcotic:
        await db.execute(delete(Narcotic).where(Narcotic.id == narcotic_id))
        await db.commit()
        return True
    return False