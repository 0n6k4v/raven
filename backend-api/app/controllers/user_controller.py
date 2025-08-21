from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Union
from app.models.user_model import User
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

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
    return result.scalars().all()