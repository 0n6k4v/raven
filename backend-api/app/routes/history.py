from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.schemas.history_schema import HistoryWithExhibit
from app.config.db_config import get_async_db
from app.controllers.history_controller import HistoryController
from app.controllers.auth_controller import get_current_active_user_from_cookie
from app.schemas.user_schema import UserInDB

router = APIRouter(tags=["history"])

history_controller = HistoryController()

@router.get("/history", response_model=List[HistoryWithExhibit])
async def get_all_histories(user_id: Optional[str] = None, db: AsyncSession = Depends(get_async_db)):
    histories = await history_controller.get_all_histories(db, user_id)
    return histories

@router.get("/history/narcotics", response_model=List[HistoryWithExhibit])
async def get_narcotic_histories(db: AsyncSession = Depends(get_async_db)):
    histories = await history_controller.get_narcotic_histories(db)
    return histories

@router.get("/history/{history_id}", response_model=HistoryWithExhibit)
async def get_history_by_id(history_id: int, db: AsyncSession = Depends(get_async_db)):
    history = await history_controller.get_history_by_id(db, history_id)
    if not history:
        raise HTTPException(status_code=404, detail="History record not found")
    return history

@router.delete("/history/{history_id}", status_code=status.HTTP_200_OK)
async def delete_history_endpoint(history_id: int, db: AsyncSession = Depends(get_async_db)):
    deleted = await history_controller.delete_history(db, history_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="History record not found")
    
    return {"message": "History record deleted successfully"}

@router.get(
  "/history/exhibit/{exhibit_id}/user/{user_id}",
  response_model=List[HistoryWithExhibit],
  summary="Get histories for an exhibit filtered by user",
)
async def get_histories_by_exhibit_and_user(
  exhibit_id: int,
  user_id: str,
  db: AsyncSession = Depends(get_async_db),
  current_user: UserInDB = Depends(get_current_active_user_from_cookie),
) -> List[HistoryWithExhibit]:
  histories = await history_controller.get_histories_by_exhibit_and_user(
    db,
    exhibit_id=exhibit_id,
    user_id=user_id,
    requesting_user=current_user
  )

  return histories