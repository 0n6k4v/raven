from fastapi import APIRouter, Depends
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.db_config import get_async_db
from app.schemas.narcotic_schema import NarcoticWithRelations
from app.controllers.narcotic_controller import get_narcotics

router = APIRouter(tags=["narcotics"])

@router.get("/narcotics", response_model=List[NarcoticWithRelations])
async def read_narcotics(
    db: AsyncSession = Depends(get_async_db),
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    drug_category: Optional[str] = None,
    drug_type: Optional[str] = None,
    form_id: Optional[int] = None,
    include_relations: bool = True
):
    narcotics = await get_narcotics(
        db,
        skip=skip,
        limit=limit,
        search=search,
        drug_category=drug_category,
        drug_type=drug_type,
        form_id=form_id,
        include_relations=include_relations
    )
    
    return narcotics