from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.role_model import Role
from fastapi import HTTPException, status

async def get_role_by_id(db: AsyncSession, role_id: int):
    result = await db.execute(
        select(Role).where(Role.id == role_id).limit(1)
    )
    role = result.scalar_one_or_none()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบระดับผู้ใช้ดังกล่าว"
        )
    return role