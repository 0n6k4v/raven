from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.controllers.firearm_controller import FirearmController
from app.schemas.firearm_schema import FirearmRead

from app.config.db_config import get_async_db

router = APIRouter(tags=["firearm"])


@router.get(
    "/firearm/get-by-normalized",
    response_model=FirearmRead,
    summary="Get firearm by normalized name",
    description="Normalize the provided name and return the matching firearm record."
)
async def get_firearm_by_normalized(
    normalized_name: Annotated[str, ...],
    db: AsyncSession = Depends(get_async_db),
) -> FirearmRead:
    return await FirearmController.get_by_normalized_name(db, normalized_name)