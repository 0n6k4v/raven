from fastapi import APIRouter, status, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.narcotic_schema import NarcoticWithRelations, NarcoticCreate
from app.schemas.narcotic_pill_schema import NarcoticPillBase
from app.config.db_config import get_async_db
from app.controllers.exhibit_controller import get_exhibit_by_id
from app.controllers.narcotic_controller import get_narcotics, delete_narcotic, get_narcotic_with_relations

router = APIRouter(tags=["narcotics"])

@router.post("/narcotic", response_model=NarcoticWithRelations, status_code=status.HTTP_201_CREATED)
async def create_narcotic(
    narcotic: NarcoticCreate,
    db: AsyncSession = Depends(get_async_db)
):
    try:
        exhibit_id = narcotic.exhibit_id
        exhibit = await get_exhibit_by_id(db, exhibit_id)
        if not exhibit:
            raise HTTPException(status_code=404, detail="Exhibit not found")
        
        narcotics = await get_narcotics(db)
        existing_narcotic = next((n for n in narcotics if n.exhibit_id == exhibit_id), None)
        if existing_narcotic:
            raise HTTPException(
                status_code=400, 
                detail="This exhibit already has an associated narcotic"
            )
        
        from app.models.narcotic_model import Narcotic as NarcoticModel
        narcotic_dict = narcotic.model_dump()
        db_narcotic = NarcoticModel(**narcotic_dict)
        db.add(db_narcotic)
        await db.commit()
        await db.refresh(db_narcotic)
        
        return await get_narcotic_with_relations(
            db,
            db_narcotic.id
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create narcotic: {str(e)}"
        )

@router.post("/narcotics/pill", status_code=status.HTTP_200_OK, response_model=NarcoticPillBase)
async def create_pill_info(
    pill_info: NarcoticPillBase,
    db: AsyncSession = Depends(get_async_db)
):
    narcotic_id = pill_info.narcotic_id
    
    if not narcotic_id:
        raise HTTPException(status_code=400, detail="narcotic_id is required")
    
    db_narcotic = await get_narcotic(db, narcotic_id)
    
    if not db_narcotic:
        raise HTTPException(status_code=404, detail="Narcotic not found")
    
    result = await NarcoticService.create_pill_info(
        db,
        narcotic_id,
        pill_info
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create pill information")
    
    return result

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

@router.delete("/narcotics/{narcotic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_narcotic_by_id(
    narcotic_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    success = await delete_narcotic(db, narcotic_id)
    if not success:
        raise HTTPException(status_code=404, detail="Narcotic not found")
    return None