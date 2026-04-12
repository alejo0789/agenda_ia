from sqlalchemy import Column, String
from ..database import Base

class LiztoConfig(Base):
    __tablename__ = "lizto_config"

    key = Column(String(100), primary_key=True)
    value = Column(String(500), nullable=False)
