from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.schemas.history_schema import HistoryWithExhibit
from app.config.db_config import get_async_db
from app.controllers.history_controller import (
    get_all_histories as ctrl_get_all_histories,
    get_history_by_id as ctrl_get_history_by_id,
)

router = APIRouter(tags=["history"])

@router.get("/history", response_model=List[HistoryWithExhibit])
async def get_all_histories(user_id: Optional[str] = None, db: AsyncSession = Depends(get_async_db)):
    histories = await ctrl_get_all_histories(db, user_id)
    return histories

@router.get("/history/{history_id}", response_model=HistoryWithExhibit)
async def get_history_by_id(history_id: int, db: AsyncSession = Depends(get_async_db)):
    history = await ctrl_get_history_by_id(db, history_id)
    if not history:
        raise HTTPException(status_code=404, detail="History record not found")
    return history