from fastapi import APIRouter, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.db_config import get_async_db
from app.schemas.exhibit_schema import Exhibit as ExhibitSchema, ExhibitCreate
from app.controllers.exhibit_controller import create_exhibit

router = APIRouter(tags=["exhibits"])

@router.post("/exhibits", response_model=ExhibitSchema, status_code=status.HTTP_201_CREATED)
async def create_new_exhibit(
    exhibit: ExhibitCreate,
    db: AsyncSession = Depends(get_async_db)
):
    exhibit_data = exhibit.model_dump()
    
    new_exhibit = await create_exhibit(db, exhibit_data)
    return new_exhibit