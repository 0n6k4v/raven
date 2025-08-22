from app.models.base import Base
from sqlalchemy import Column, Integer, ForeignKey, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship

class UserPermission(Base):
    __tablename__ = "user_permissions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    permission_type = Column(String(50), nullable=False)
    granted = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship
    user = relationship("User", back_populates="permissions")