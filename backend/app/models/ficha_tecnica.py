from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from ..database import Base


class PlantillaFicha(Base):
    __tablename__ = "plantillas_fichas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    activa = Column(Boolean, default=True)
    sede_id = Column(Integer, ForeignKey("sedes.id"), nullable=True, index=True) # por si es global o por sede
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    campos = relationship("CampoFicha", back_populates="plantilla", cascade="all, delete-orphan", order_by="CampoFicha.orden")
    citas_fichas = relationship("CitaFicha", back_populates="plantilla")

class TipoCampoFicha(str, enum.Enum):
    TEXTO_CORTO = "texto_corto"
    TEXTO_LARGO = "texto_largo"
    NUMERO = "numero"
    OPCION_MULTIPLE = "opcion_multiple"
    CASILLAS = "casillas"
    FECHA = "fecha"
    INFORMATIVO = "informativo"  # Bloque de texto sin respuesta, solo lectura para el cliente

class CampoFicha(Base):
    __tablename__ = "campos_fichas"

    id = Column(Integer, primary_key=True, index=True)
    plantilla_id = Column(Integer, ForeignKey("plantillas_fichas.id"), nullable=False, index=True)
    nombre = Column(Text, nullable=False)
    tipo = Column(String(50), nullable=False) # TipoCampoFicha pero string para sqlite
    opciones = Column(Text, nullable=True) # JSON o separado por comas
    requerido = Column(Boolean, default=False)
    orden = Column(Integer, default=0)

    # Relaciones
    plantilla = relationship("PlantillaFicha", back_populates="campos")


class EstadoCitaFicha(str, enum.Enum):
    PENDIENTE = "pendiente"
    ENVIADA = "enviada"
    DILIGENCIADA = "diligenciada"

class CitaFicha(Base):
    __tablename__ = "citas_fichas"

    id = Column(Integer, primary_key=True, index=True)
    cita_id = Column(Integer, ForeignKey("citas.id"), nullable=False, index=True)
    plantilla_id = Column(Integer, ForeignKey("plantillas_fichas.id"), nullable=False, index=True)
    estado = Column(String(50), default="pendiente")
    token_publico = Column(String(100), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    
    fecha_envio = Column(DateTime(timezone=True), nullable=True)
    fecha_diligenciamiento = Column(DateTime(timezone=True), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    plantilla = relationship("PlantillaFicha", back_populates="citas_fichas")
    respuestas = relationship("RespuestaFicha", back_populates="cita_ficha", cascade="all, delete-orphan")


class RespuestaFicha(Base):
    __tablename__ = "respuestas_fichas"

    id = Column(Integer, primary_key=True, index=True)
    cita_ficha_id = Column(Integer, ForeignKey("citas_fichas.id"), nullable=False, index=True)
    campo_id = Column(Integer, ForeignKey("campos_fichas.id"), nullable=False, index=True)
    valor = Column(Text, nullable=True)

    # Relaciones
    cita_ficha = relationship("CitaFicha", back_populates="respuestas")
    campo = relationship("CampoFicha")
