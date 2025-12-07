from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, nullable=False)
    descripcion = Column(String)
    es_sistema = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    usuarios = relationship("Usuario", back_populates="rol")

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    nombre = Column(String, nullable=False)
    especialista_id = Column(Integer, nullable=True) # ForeignKey added later in SQL, keeping as Int for now or we can add relationship if needed
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    estado = Column(String, default="activo")
    ultimo_acceso = Column(DateTime(timezone=True))
    intentos_fallidos = Column(Integer, default=0)
    fecha_bloqueo = Column(DateTime(timezone=True))
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    rol = relationship("Rol", back_populates="usuarios")
