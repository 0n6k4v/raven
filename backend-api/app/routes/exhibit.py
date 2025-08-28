from fastapi import APIRouter, status, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.db_config import get_async_db
from app.schemas.exhibit_schema import Exhibit as ExhibitSchema, ExhibitCreate
from app.schemas.narcotic_example_image_schema import NarcoticExampleImageBase, NarcoticExampleImage as NarcoticImageSchema
from app.controllers.exhibit_controller import create_exhibit, get_exhibit_by_id
from app.controllers.narcotic_controller import get_narcotic, add_example_image
from app.config.cloudinary_config import upload_image_to_cloudinary

router = APIRouter(tags=["exhibits"])

@router.post("/exhibits", response_model=ExhibitSchema, status_code=status.HTTP_201_CREATED)
async def create_new_exhibit(
    exhibit: ExhibitCreate,
    db: AsyncSession = Depends(get_async_db)
):
    exhibit_data = exhibit.model_dump()
    
    new_exhibit = await create_exhibit(db, exhibit_data)
    return new_exhibit

@router.post("/exhibits/{exhibit_id}/narcotic/{narcotic_id}/images", response_model=NarcoticImageSchema)
async def upload_narcotic_image(
    exhibit_id: int,
    narcotic_id: int,
    file: UploadFile = File(...),
    description: str = Form(""),
    priority: int = Form(0),
    image_type: str = Form("default"),
    db: AsyncSession = Depends(get_async_db)
):
    exhibit = await get_exhibit_by_id(db, exhibit_id)
    if not exhibit:
        raise HTTPException(status_code=404, detail="Exhibit not found")
    
    db_narcotic = await get_narcotic(db, narcotic_id)
    
    if not db_narcotic or db_narcotic.exhibit_id != exhibit_id:
        raise HTTPException(status_code=404, detail="Narcotic not found for this exhibit")
    
    try:
        cloudinary_result = await upload_image_to_cloudinary(file)
        
        image_data = NarcoticExampleImageBase(
            narcotic_id=narcotic_id,
            image_url=cloudinary_result["secure_url"],
            description=description,
            priority=priority,
            image_type=image_type
        )
        
        image = await add_example_image(db, image_data)
        
        return image
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")