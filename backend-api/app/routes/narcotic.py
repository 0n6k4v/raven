from fastapi import APIRouter, status, Depends, HTTPException, Body
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.db_config import get_async_db
from app.schemas.narcotic_pill_schema import NarcoticPill
from app.schemas.narcotic_schema import NarcoticWithRelations, NarcoticCreate
from app.controllers.exhibit_controller import ExhibitController
from app.controllers.narcotic_controller import NarcoticController
from app.controllers.narcotic_image_vector_controller import search_similar_narcotics_with_vector

router = APIRouter(tags=["narcotics"])

@router.post("/narcotic", response_model=NarcoticWithRelations, status_code=status.HTTP_201_CREATED)
async def create_narcotic(
    narcotic: NarcoticCreate,
    db: AsyncSession = Depends(get_async_db)
):
    try:
        exhibit_id = narcotic.exhibit_id
        exhibit_controller = ExhibitController(db)
        exhibit = await exhibit_controller.get_exhibit_by_id(exhibit_id)
        if not exhibit:
            raise HTTPException(status_code=404, detail="Exhibit not found")
        
        narcotic_controller = NarcoticController(db)
        narcotics = await narcotic_controller.get_narcotics()
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
        
        return await narcotic_controller.get_narcotic_with_relations(db_narcotic.id)

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create narcotic: {str(e)}"
        )

@router.post("/narcotics/pill", status_code=status.HTTP_200_OK, response_model=NarcoticPill)
async def create_pill_info(
    pill_info: NarcoticPill,
    db: AsyncSession = Depends(get_async_db)
):
    if hasattr(pill_info, "model_dump"):
        payload = pill_info.model_dump()
    elif hasattr(pill_info, "dict"):
        payload = pill_info.dict()
    else:
        payload = pill_info

    narcotic_id = payload.get("narcotic_id") or payload.get("narcoticId") or payload.get("id")

    if not narcotic_id:
        raise HTTPException(status_code=400, detail="narcotic_id is required")

    narcotic_controller = NarcoticController(db)
    db_narcotic = await narcotic_controller.get_narcotic(narcotic_id)
     
    if not db_narcotic:
        raise HTTPException(status_code=404, detail="Narcotic not found")
    
    result = await narcotic_controller.create_pill_info(
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
    narcotic_controller = NarcoticController(db)
    narcotics = await narcotic_controller.get_narcotics(
        skip=skip,
        limit=limit,
        search=search,
        drug_category=drug_category,
        drug_type=drug_type,
        form_id=form_id,
        include_relations=include_relations
    )
    
    return narcotics

@router.get("/narcotics/{narcotic_id}", response_model=NarcoticWithRelations)
async def read_narcotic(
    narcotic_id: int, 
    db: AsyncSession = Depends(get_async_db)
):
    narcotic_controller = NarcoticController(db)
    narcotic = await narcotic_controller.get_narcotic_with_relations(narcotic_id)
    
    if not narcotic:
        raise HTTPException(status_code=404, detail="Narcotic not found")
        
    return narcotic

@router.post("/search-vector", response_model=Dict[str, List[Dict[str, Any]]])
async def search_similar_narcotics(
    vector: List[float] = Body(None),
    vector_base64: str = Body(None),
    top_k: int = Body(3),
    similarity_threshold: float = Body(0.05),
    db: AsyncSession = Depends(get_async_db)
):
    try:
        results = await search_similar_narcotics_with_vector(
            db=db,
            vector=vector,
            vector_base64=vector_base64,
            top_k=top_k,
            similarity_threshold=similarity_threshold
        )
        return {"results": results}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/narcotics/{narcotic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_narcotic_by_id(
    narcotic_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    narcotic_controller = NarcoticController(db)
    success = await narcotic_controller.delete_narcotic(narcotic_id)
    if not success:
        raise HTTPException(status_code=404, detail="Narcotic not found")
    return None

@router.post("/narcotics/images/vector/save", status_code=status.HTTP_201_CREATED)
async def save_image_vector(
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_async_db)
):
    narcotic_id = payload.get("narcotic_id") or payload.get("narcoticId") or payload.get("id")
    image_id = payload.get("image_id") or payload.get("imageId")
    vector_data = payload.get("vector_data") or payload.get("vector")

    if not narcotic_id:
        raise HTTPException(status_code=400, detail="narcotic_id is required")
    if not image_id:
        raise HTTPException(status_code=400, detail="image_id is required")
    if not vector_data or not isinstance(vector_data, list):
        raise HTTPException(status_code=400, detail="vector_data (list of floats) is required")

    narcotic_controller = NarcoticController(db)

    db_narcotic = await narcotic_controller.get_narcotic(int(narcotic_id))
    if not db_narcotic:
        raise HTTPException(status_code=404, detail="Narcotic not found")

    try:
        db_vector = await narcotic_controller.add_image_vector(int(narcotic_id), int(image_id), vector_data)
        return {
            "success": True,
            "vector_id": getattr(db_vector, "id", None),
            "narcotic_id": int(narcotic_id),
            "image_id": int(image_id),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image vector: {str(e)}")