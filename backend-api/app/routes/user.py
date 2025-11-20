from fastapi import APIRouter, Cookie, Depends, Query, Form, File, UploadFile, HTTPException, status
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.user_schema import User, PaginatedUserResponse, UserResponse
from app.controllers.auth_controller import get_current_active_user_from_cookie
from app.controllers.user_controller import get_all_users, get_user_by_user_id, update_user, delete_user_profile_image
from app.config.db_config import get_async_db
from app.config.cloudinary_config import upload_image_to_cloudinary
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

async def get_user(
    access_token: str = Cookie(None),
    db: AsyncSession = Depends(get_async_db)
):
    return await get_current_active_user_from_cookie(access_token, db)

@router.get("/me", response_model=User)
async def read_users_me(user: User = Depends(get_user)):
    return user

@router.get("/me/items")
async def read_own_items(user: User = Depends(get_user)):
    return [{"item_id": "Foo", "owner": user.email}]

@router.get("/users/list", response_model=PaginatedUserResponse)
async def list_users(
    page: int = Query(1, description="จำนวนหน้า"),
    limit: int = Query(10, description="จำนวนรายการต่อหน้า"),
    search: Optional[str] = Query(None, description="คำค้นหา"),
    role_id: Optional[int] = Query(None, description="กรองจาก Role ID"),
    db: AsyncSession = Depends(get_async_db)
):
    skip = (page - 1) * limit
    users = await get_all_users(db, skip=skip, limit=limit, search=search, role_id=role_id)
    total_count = len(users) if page == 1 else await get_all_users(db, count_only=True, search=search, role_id=role_id)
    total_pages = (total_count + limit - 1) // limit
    return {
        "users": users,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_async_db)):
    return await get_user_by_user_id(db, user_id=user_id)

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_info(
    user_id: str,
    title: str = Form(...),
    firstname: str = Form(...),
    lastname: str = Form(...),
    email: str = Form(...),
    password: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    role_id: int = Form(...),
    is_active: bool = Form(...),
    profile_image: Optional[UploadFile] = File(None),
    remove_profile_image: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_async_db)
):
    user = await get_user_by_user_id(db, user_id=user_id)
    
    profile_image_url = user.profile_image_url
    profile_image_public_id = getattr(user, 'profile_image_public_id', None)
    # remove_profile_image flag: mark it to be processed in the controller
    if remove_profile_image == 'true' and profile_image:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Cannot remove and upload in the same request; please remove or upload only.")

    remove_profile_image_flag = False
    if remove_profile_image == 'true':
        # Mark removal in the user_data for controller handling on save
        remove_profile_image_flag = True

    if profile_image:
        # The actual upload is handled by controller for delete-first semantics.
        user_profile_image = profile_image
    else:
        user_profile_image = None

    user_data = {
    "title": title,
    "firstname": firstname,
    "lastname": lastname,
    "email": email,
    "department": department,
    "role_id": role_id,
    "is_active": is_active,
        "profile_image_url": profile_image_url,
        "profile_image_public_id": profile_image_public_id,
        "profile_image": user_profile_image,
        "remove_profile_image": remove_profile_image_flag,
    }
    
    if password:
        user_data["password"] = password

    logger.info("Updating user %s with data keys: %s", user_id, list(user_data.keys()))
    logger.debug("[routes.user] Updating user %s with keys: %s", user_id, list(user_data.keys()))
    try:
        updated_user = await update_user(db=db, user_id=user_id, user_data=user_data)
        logger.info("Update result for user %s: profile_image_url=%s, profile_image_public_id=%s", user_id, updated_user.profile_image_url, getattr(updated_user, 'profile_image_public_id', None))
        logger.debug("[routes.user] Update result for user %s: profile_image_url=%s profile_image_public_id=%s", user_id, updated_user.profile_image_url, getattr(updated_user, 'profile_image_public_id', None))
    except Exception as e:
        logger.exception("Failed to update user %s: %s", user_id, e)
        logger.debug("[routes.user] Exception during update user %s: %s", user_id, e)
        raise
    return updated_user


@router.delete("/users/{user_id}/profile-image", response_model=UserResponse)
async def delete_user_profile_image_route(
    user_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    logger.debug("[routes.user] DELETE /users/%s/profile-image called", user_id)
    try:
        updated_user = await delete_user_profile_image(db, user_id)
        logger.debug("[routes.user] Delete result for user %s: profile_image_url=%s profile_image_public_id=%s", user_id, getattr(updated_user, 'profile_image_url', None), getattr(updated_user, 'profile_image_public_id', None))
        return updated_user
    except HTTPException as e:
        logger.debug("[routes.user] Delete endpoint HTTPException for user %s: %s", user_id, e.detail)
        raise
    except Exception as e:
        logger.debug("[routes.user] Delete endpoint error for user %s: %s", user_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete profile image: {e}")