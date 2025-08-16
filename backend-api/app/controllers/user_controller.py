# from sqlalchemy.ext.asyncio import AsyncSession
# from typing import Optional, List
# from app.models.user_model.py import User
# from sqlalchemy import select

# async def get_all_users(
#     db: AsyncSession,
#     skip: int = 0,
#     limit: int = 100,
#     search: Optional[str] = None,
#     role_id: Optional[int] = None,
#     count_only: bool = False
# ) -> Union[List[User], int]:
#     Args:
#         db: Database session
#         skip: Number of records to skip for pagination
#         limit: Maximum number of records to return
#         search: Optional search string to filter users
#         role_id: Optional role ID to filter users
#         count_only: If True, return only the count of users
#     Returns:
#         Either a list of users or the count of users matching the criteria
    
#     query = select(User).options(selectinload(User.role), selectinload(User.permissions))

#     if search:
#         search_term = f"%{search}%"
#         query = query.where(
#             or_(
#                 User.firstname.ilike(search_term),
#                 User.lastname.ilike(search_term),
#                 User.email.ilike(search_term),
#                 User.user_id.ilike(search_term),
#                 User.department.ilike(search_term)
#             )
#         )
    
#     if role_id:
#         query = query.where(User.role_id == role_id)

#     if count_only:
#         count_query = select(func.count()).select_from(query.subquery())
#         result = await db.execute(count_query)
#         return result.scalar()

#     query = query.offset(skip).limit(limit)

#     result = await db.execute(query)
#     return result.scalars().all()