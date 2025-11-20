from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Union, Dict, Any
from app.models.user_model import User
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.config.cloudinary_config import delete_image_from_cloudinary, upload_image_to_cloudinary
import logging

logger = logging.getLogger(__name__)

async def get_all_users(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role_id: Optional[int] = None,
    count_only: bool = False
) -> Union[List[User], int]:
    filters = []

    if search:
        term = f"%{search}%"
        filters.append(
            or_(
                User.firstname.ilike(term),
                User.lastname.ilike(term),
                User.email.ilike(term),
                User.user_id.ilike(term),
                User.department.ilike(term),
            )
        )

    if role_id:
        filters.append(User.role_id == role_id)

    if count_only:
        count_q = select(func.count()).select_from(User)
        if filters:
            count_q = count_q.where(*filters)
        res = await db.execute(count_q)
        return res.scalar() or 0

    query = select(User).options(selectinload(User.role))
    if filters:
        query = query.where(*filters)

    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    users = result.scalars().all()
    # debug: fetched user count logged
    return users

async def get_user_by_user_id(db: AsyncSession, user_id: str):
    result = await db.execute(
        select(User)
        .options(selectinload(User.role), selectinload(User.permissions))
        .where(User.user_id == str(user_id))
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(
        select(User)
        .options(selectinload(User.role), selectinload(User.permissions))
        .where(User.email == email)
    )
    return result.scalars().first()

async def update_user(db: AsyncSession, user_id: str, user_data: Dict[str, Any]):
    db_user = await get_user_by_user_id(db, user_id)
    old_public_id = None
    if user_data.get("email") and user_data["email"] != db_user.email:
        existing_user = await get_user_by_email(db, user_data["email"])
        if existing_user and existing_user.id != db_user.id:
            logger.warning("email update conflict: user_id=%s email=%s in_use_by=%s", user_id, user_data['email'], existing_user.user_id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use by another user"
            )

    # Handle explicit removal request from the update flow
    if user_data.get("remove_profile_image"):
        public_id = getattr(db_user, "profile_image_public_id", None)
        logger.info("Remove profile image requested for user_id=%s, public_id=%s", user_id, public_id)
        if not public_id:
            # Nothing to delete; return not found to surface the issue to the client
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No profile image assigned")
        res = await delete_image_from_cloudinary(public_id, invalidate=True)
        if res.get("result") != "ok":
            # treat not found and other results as failure
            logger.error("Cloudinary deletion failed for %s: %s", public_id, res)
            raise HTTPException(status_code=500, detail=f"Cloudinary deletion failed: {res}")
        db_user.profile_image_url = None
        db_user.profile_image_public_id = None

    # Handle new upload: if file is present, delete old image first (if any), then upload new file
    if user_data.get("profile_image"):
        file = user_data.get("profile_image")
        new_public_id = None
        new_url = None
        old_public_id = getattr(db_user, "profile_image_public_id", None)
        # If there is an existing asset, delete it first
        if old_public_id:
            try:
                res_old = await delete_image_from_cloudinary(old_public_id, invalidate=True)
                if res_old.get("result") != "ok":
                    logger.warning("Failed to delete old cloudinary asset %s: %s", old_public_id, res_old)
                    raise HTTPException(status_code=500, detail=f"Cloudinary deletion failed for old asset: {res_old}")
            except HTTPException:
                raise
            except Exception as e:
                logger.exception("Error deleting old cloudinary asset for user %s: %s", user_id, e)
                raise HTTPException(status_code=500, detail="Cloudinary deletion failed")
        # Now upload the new file
        try:
            res_upload = await upload_image_to_cloudinary(file, folder="user_profiles")
            new_public_id = res_upload.get("public_id")
            new_url = res_upload.get("secure_url")
        except Exception as e:
            logger.exception("Failed to upload new profile image for user %s: %s", user_id, e)
            raise HTTPException(status_code=500, detail="Failed to upload profile image")
        old_public_id = getattr(db_user, "profile_image_public_id", None)
        logger.info("Replacing profile image for user_id=%s: old_public_id=%s -> new_public_id=%s", user_id, old_public_id, new_public_id)
        setattr(db_user, "profile_image_public_id", new_public_id)
        setattr(db_user, "profile_image_url", new_url)
    
    # Apply other updated fields
    for key, value in user_data.items():
        if key in ("remove_profile_image", "profile_image_url", "profile_image_public_id"):
            continue
        if value is not None:
            setattr(db_user, key, value)
    
    await db.commit()
    await db.refresh(db_user)

    # No post-commit cleanup is required because old assets are deleted prior to uploading

    return db_user


async def delete_user_profile_image(db: AsyncSession, user_id: str):
    """Delete a user's profile image stored in Cloudinary and clear DB fields on success.

    Returns the updated user on successful deletion (Cloudinary returns {'result': 'ok'}).
    If Cloudinary returns 'not found', do NOT clear DB and raise 404.
    """
    db_user = await get_user_by_user_id(db, user_id)
    public_id = getattr(db_user, "profile_image_public_id", None)
    logger.info("Delete profile image requested for user_id=%s public_id=%s", user_id, public_id)

    if not public_id:
        # No public id assigned -> nothing to delete
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No profile image assigned")

    try:
        res = await delete_image_from_cloudinary(public_id, invalidate=True)
    except Exception as e:
        # error contacting Cloudinary
        logger.exception("Cloudinary destroy raised an exception for public_id=%s: %s", public_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Cloudinary deletion failed")


    if res.get("result") == "ok":
        # Clear DB fields and return user
        db_user.profile_image_url = None
        db_user.profile_image_public_id = None
        await db.commit()
        await db.refresh(db_user)
        return db_user
    elif res.get("result") == "not found":
        # Treat not found as a failure and do not clear DB
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Cloudinary resource not found: {public_id}")
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Cloudinary deletion failed: {res}")