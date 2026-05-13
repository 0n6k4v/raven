from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date, time

import traceback

from app.schemas.history_schema import HistoryWithExhibit, HistoryCreate
from app.config.db_config import get_async_db
from app.controllers.history_controller import HistoryController
from app.controllers.auth_controller import get_current_active_user_from_cookie
from app.schemas.user_schema import UserInDB

router = APIRouter(tags=["history"])
history_controller = HistoryController()


# --- Helper function

def get_user_info(current_user: UserInDB):
    user_id = getattr(current_user, "user_id", None)
    return user_id or "system"


# --- exception handler ---

async def handle_exceptions(func, *args, **kwargs):
    try:
        return await func(*args, **kwargs)
    except (ValueError, ValidationError) as e:
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except IntegrityError:
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Database integrity error")
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


# --- Create ---

@router.post("/history", response_model=HistoryWithExhibit)
async def create_history(
    exhibit_id: Optional[int] = Form(None),
    subdistrict_id: int = Form(...),
    discovery_date: Optional[date] = Form(None),
    discovery_time: Optional[time] = Form(None),
    quantity: Optional[float] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    ai_confidence: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_async_db),
    current_user: UserInDB = Depends(get_current_active_user_from_cookie),
):
    # Validate required fields
    required_fields = {
        "exhibit_id": exhibit_id,
        "discovery_date": discovery_date,
        "discovery_time": discovery_time,
        "ai_confidence": ai_confidence,
        "image": image,
    }
    missing_fields = [k for k, v in required_fields.items() if v is None]
    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required field(s): {', '.join(missing_fields)}",
        )

    history_dict = {
        "exhibit_id": exhibit_id,
        "subdistrict_id": subdistrict_id,
        "latitude": latitude,
        "longitude": longitude,
        "quantity": quantity,
        "ai_confidence": ai_confidence,
        "discovery_date": discovery_date.isoformat() if discovery_date else None,
        "discovery_time": discovery_time.strftime("%H:%M") if discovery_time else None,
        "discovered_by": get_user_info(current_user),
        "modified_by": get_user_info(current_user),
    }

    history_data = HistoryCreate(**history_dict)
    return await handle_exceptions(history_controller.create_history, db, history_data, image)


# --- Read ---

@router.get("/history", response_model=List[HistoryWithExhibit])
async def get_all_histories(
    user_id: Optional[str] = None, db: AsyncSession = Depends(get_async_db)
):
    return await handle_exceptions(history_controller.get_all_histories, db, user_id)


@router.get("/history/narcotics", response_model=List[HistoryWithExhibit])
async def get_narcotic_histories(db: AsyncSession = Depends(get_async_db)):
    return await handle_exceptions(history_controller.get_narcotic_histories, db)


@router.get("/history/{history_id}", response_model=HistoryWithExhibit)
async def get_history_by_id(history_id: int, db: AsyncSession = Depends(get_async_db)):
    history = await handle_exceptions(history_controller.get_history_by_id, db, history_id)
    if not history:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History record not found")
    return history


@router.get(
    "/history/exhibit/{exhibit_id}",
    response_model=List[HistoryWithExhibit],
    summary="Get histories for an exhibit (applies user permission from cookie)",
)
async def get_histories_by_exhibit(
    exhibit_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserInDB = Depends(get_current_active_user_from_cookie),
):
    return await handle_exceptions(
        history_controller.get_histories_by_exhibit,
        db=db,
        exhibit_id=exhibit_id,
        requesting_user=current_user,
    )


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
):
    return await handle_exceptions(
        history_controller.get_histories_by_exhibit_and_user,
        db=db,
        exhibit_id=exhibit_id,
        user_id=user_id,
        requesting_user=current_user,
    )


# --- Delete ---

@router.delete("/history/{history_id}", status_code=status.HTTP_200_OK)
async def delete_history_endpoint(history_id: int, db: AsyncSession = Depends(get_async_db)):
    deleted = await handle_exceptions(history_controller.delete_history, db, history_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History record not found")
    return {"message": "History record deleted successfully"}