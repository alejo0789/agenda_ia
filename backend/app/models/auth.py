from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Permiso(Base):
    __tablename__ = "permisos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, nullable=False)
    nombre = Column(String, nullable=False)
    modulo = Column(String, nullable=False)
    descripcion = Column(Text)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

class RolPermiso(Base):
    __tablename__ = "rol_permisos"

    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permiso_id = Column(Integer, ForeignKey("permisos.id", ondelete="CASCADE"), primary_key=True)

class Sesion(Base):
    __tablename__ = "sesiones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    ip = Column(String)
    user_agent = Column(Text)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_expiracion = Column(DateTime(timezone=True), nullable=False)

    usuario = relationship("Usuario", backref="sesiones")

class LogAuditoria(Base):
    __tablename__ = "log_auditoria"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    accion = Column(String, nullable=False)
    modulo = Column(String, nullable=False)
    entidad = Column(String)
    entidad_id = Column(Integer)
    datos_anteriores = Column(JSON)
    datos_nuevos = Column(JSON)
    ip = Column(String)
    fecha = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    usuario = relationship("Usuario", backref="logs_auditoria")
