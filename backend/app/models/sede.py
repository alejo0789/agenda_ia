from sqlalchemy import Column, Integer, String, Boolean, DateTime, CheckConstraint, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Sede(Base):
    __tablename__ = "sedes"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(100), nullable=False)
    direccion = Column(String, nullable=True)
    telefono = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    estado = Column(String(20), default="activa", nullable=False) # activa, inactiva
    es_principal = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Restricción check para estado
    __table_args__ = (
        CheckConstraint("estado IN ('activa', 'inactiva')", name='check_estado_sede'),
    )

    usuarios = relationship("Usuario", back_populates="sede")
