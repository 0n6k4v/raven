from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.schemas.user_schema import TokenData, User, UserInDB
from app.schemas.role_schema import RoleBase
from app.config.db_config import get_db
from app.config.auth_config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.user_model import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_user_from_db(email: str, db: Optional[Session] = None) -> Optional[UserInDB]:
    if db is None:
        db = next(get_db())
    user_obj = db.query(User).filter(User.email == email).first()
    if user_obj:
        role_dict = {
            "id": user_obj.role.id,
            "role_name": user_obj.role.role_name,
            "description": user_obj.role.description
        }
        return UserInDB(
            id=user_obj.id,
            user_id=user_obj.user_id,
            title=user_obj.title,
            firstname=user_obj.firstname,
            lastname=user_obj.lastname,
            email=user_obj.email,
            department=user_obj.department,
            profile_image_url=user_obj.profile_image_url,
            hashed_password=user_obj.password,
            role=RoleBase.model_validate(role_dict) if role_dict else None
        )
    return None

def authenticate_user(email: str, password: str, db: Optional[Session] = None) -> Optional[UserInDB]:
    user = get_user_from_db(email, db)
    if user and verify_password(password, user.hashed_password):
        return user
    return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "sub": data.get("sub")})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise credentials_exception
        token_data = TokenData(email=email)
    except InvalidTokenError:
        raise credentials_exception
    user = get_user_from_db(token_data.email, db)
    if not user:
        raise credentials_exception
    return user

async def get_current_active_user_from_cookie(token: str, db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise credentials_exception
        token_data = TokenData(email=email)
    except InvalidTokenError:
        raise credentials_exception
    user = get_user_from_db(token_data.email, db)
    if not user or getattr(user, "disabled", False):
        raise credentials_exception
    return user