from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Union, Dict, Any
from app.models.user_model import User
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.config.cloudinary_config import delete_image_from_cloudinary, upload_image_to_cloudinary
from app.models.user_permission_model import UserPermission
import logging

logger = logging.getLogger(__name__)

# CREATE

async def create_user(db: AsyncSession, user_data: Dict[str, Any]):
    existing_user = await get_user_by_email(db, email=user_data["email"])
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use"
        )

    db_user = User(
        title=user_data.get("title"),
        firstname=user_data.get("firstname"),
        lastname=user_data.get("lastname"),
        email=user_data.get("email"),
        password=user_data.get("password"),
        department=user_data.get("department"),
        role_id=user_data.get("role_id"),
        profile_image_url=user_data.get("profile_image_url"),
        profile_image_public_id=user_data.get("profile_image_public_id")
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    logger.info("[controllers.user] Created user: user_id=%s profile_image_public_id=%s", db_user.user_id, getattr(db_user, 'profile_image_public_id', None))
    
    if "permissions" in user_data and user_data["permissions"]:
        for permission_type in user_data["permissions"]:
            permission = UserPermission(
                user_id=db_user.id,
                permission_type=permission_type
            )
            db.add(permission)
        
        await db.commit()
    
    return await get_user_by_user_id(db, db_user.user_id)

# READ

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

# UPDATE

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

    if user_data.get("remove_profile_image"):
        public_id = getattr(db_user, "profile_image_public_id", None)
        logger.info("Remove profile image requested for user_id=%s, public_id=%s", user_id, public_id)
        if not public_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No profile image assigned")
        res = await delete_image_from_cloudinary(public_id, invalidate=True)
        if res.get("result") != "ok":
            logger.error("Cloudinary deletion failed for %s: %s", public_id, res)
            raise HTTPException(status_code=500, detail=f"Cloudinary deletion failed: {res}")
        db_user.profile_image_url = None
        db_user.profile_image_public_id = None

    if user_data.get("profile_image"):
        file = user_data.get("profile_image")
        new_public_id = None
        new_url = None
        old_public_id = getattr(db_user, "profile_image_public_id", None)
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
    
    for key, value in user_data.items():
        if key in ("remove_profile_image", "profile_image_url", "profile_image_public_id"):
            continue
        if value is not None:
            setattr(db_user, key, value)
    
    await db.commit()
    await db.refresh(db_user)

    return db_user

# DELETE

async def delete_user(db: AsyncSession, user_id: str):
    db_user = await get_user_by_user_id(db, user_id)
    public_id = getattr(db_user, "profile_image_public_id", None)
    if public_id:
        logger.info("Deleting Cloudinary asset for user %s: public_id=%s", user_id, public_id)
        try:
            res = await delete_image_from_cloudinary(public_id, invalidate=True)
        except Exception as e:
            logger.exception("Failed to delete Cloudinary image for user %s, public_id=%s: %s", user_id, public_id, e)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete Cloudinary profile image")

        if res.get("result") == "ok":
            logger.info("Cloudinary asset deleted for user %s: public_id=%s", user_id, public_id)
        elif res.get("result") == "not found":
            logger.warning("Cloudinary asset not found for user %s: public_id=%s. Proceeding to delete DB user.", user_id, public_id)
        else:
            logger.error("Cloudinary deletion returned unexpected result for user %s: %s", user_id, res)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete Cloudinary resource: {res}")

    # Now delete the user DB record
    await db.delete(db_user)
    await db.commit()

    return {"message": "User deleted successfully"}

async def delete_user_profile_image(db: AsyncSession, user_id: str):
    db_user = await get_user_by_user_id(db, user_id)
    public_id = getattr(db_user, "profile_image_public_id", None)
    logger.info("Delete profile image requested for user_id=%s public_id=%s", user_id, public_id)

    if not public_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No profile image assigned")

    try:
        res = await delete_image_from_cloudinary(public_id, invalidate=True)
    except Exception as e:
        logger.exception("Cloudinary destroy raised an exception for public_id=%s: %s", public_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Cloudinary deletion failed")


    if res.get("result") == "ok":
        db_user.profile_image_url = None
        db_user.profile_image_public_id = None
        await db.commit()
        await db.refresh(db_user)
        return db_user
    elif res.get("result") == "not found":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Cloudinary resource not found: {public_id}")
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Cloudinary deletion failed: {res}")