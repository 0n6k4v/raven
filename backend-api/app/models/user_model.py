from app.models.base import Base
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.models.role_model import Role

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    user_id = Column(String(20), unique=True, nullable=False, index=True)
    title = Column(String(20))
    firstname = Column(String(100), nullable=False, index=True)
    lastname = Column(String(100), nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(Text, nullable=False)
    department = Column(String(100), index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    profile_image_url = Column(String(255))

    #Relationships
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, index=True)
    role = relationship(Role, back_populates="users", lazy="joined")
