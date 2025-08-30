from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user_model import User

async def get_discoverer_and_modifier_names(
    db: AsyncSession,
    discovered_by: Optional[str],
    modified_by: Optional[str],
) -> Dict[str, Optional[str]]:
    user_info: Dict[str, Optional[str]] = {
        "discoverer_name": None,
        "modifier_name": None
    }

    ids = {str(x) for x in (discovered_by, modified_by) if x}
    if not ids:
        return user_info

    stmt = select(User.user_id, User.firstname, User.lastname).where(User.user_id.in_(list(ids)))
    res = await db.execute(stmt)
    rows = res.all()

    for uid, firstname, lastname in rows:
        full_name = " ".join(filter(None, [firstname, lastname])) or None
        if discovered_by and str(discovered_by) == str(uid):
            user_info["discoverer_name"] = full_name
        if modified_by and str(modified_by) == str(uid):
            user_info["modifier_name"] = full_name

    return user_info