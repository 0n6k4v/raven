from fastapi import APIRouter, status, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.db_config import get_async_db
from app.schemas.exhibit_schema import Exhibit as ExhibitSchema, ExhibitCreate
from app.schemas.narcotic_example_image_schema import NarcoticExampleImageBase, NarcoticExampleImage
from app.controllers.exhibit_controller import ExhibitController
from app.controllers.narcotic_controller import NarcoticController
from app.config.cloudinary_config import upload_image_to_cloudinary

router = APIRouter(tags=["exhibits"])

@router.post("/exhibits", response_model=ExhibitSchema, status_code=status.HTTP_201_CREATED)
async def create_new_exhibit(
    exhibit: ExhibitCreate,
    db: AsyncSession = Depends(get_async_db)
):
    exhibit_data = exhibit.model_dump()
    
    exhibit_controller = ExhibitController(db)
    new_exhibit = await exhibit_controller.create_exhibit(exhibit_data)
    return new_exhibit

@router.post("/exhibits/{exhibit_id}/narcotic/{narcotic_id}/images", response_model=NarcoticExampleImage)
async def upload_narcotic_image(
    exhibit_id: int,
    narcotic_id: int,
    file: UploadFile = File(...),
    description: str = Form(""),
    priority: int = Form(0),
    image_type: str = Form("default"),
    db: AsyncSession = Depends(get_async_db)
):
    exhibit_controller = ExhibitController(db)
    exhibit = await exhibit_controller.get_exhibit_by_id(exhibit_id)
    if not exhibit:
        raise HTTPException(status_code=404, detail="Exhibit not found")
    
    narcotic_controller = NarcoticController(db)
    db_narcotic = await narcotic_controller.get_narcotic(narcotic_id)
    
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
        
        image = await narcotic_controller.add_example_image(image_data)
        
        return image
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")