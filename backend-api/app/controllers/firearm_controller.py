from typing import Optional
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.firearm_model import Firearm
from app.schemas.firearm_schema import FirearmRead


class FirearmController:
    @staticmethod
    def _normalize_key(value: str) -> str:
        if not value:
            return ""
        return "".join(ch.lower() for ch in value if ch.isalnum())

    @staticmethod
    async def get_by_normalized_name(db: AsyncSession, normalized_name: str) -> FirearmRead:
        if normalized_name is None:
            raise HTTPException(status_code=400, detail="normalized_name is required")

        key = FirearmController._normalize_key(normalized_name)
        if not key:
            raise HTTPException(status_code=400, detail="normalized_name empty after normalization")

        stmt = (
            select(Firearm)
            .options(selectinload(Firearm.example_images))
            .where(Firearm.normalized_name == key)
            .limit(1)
        )
        result = await db.execute(stmt)
        firearm_obj = result.scalars().first()

        if firearm_obj is None:
            raise HTTPException(status_code=404, detail="Firearm not found")

        return FirearmRead.model_validate(firearm_obj)