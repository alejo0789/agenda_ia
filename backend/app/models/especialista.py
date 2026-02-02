from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date, Time, SmallInteger, DECIMAL, CheckConstraint, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Especialista(Base):
    __tablename__ = "especialistas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    documento_identidad = Column(String(20), unique=True, index=True)
    sede_id = Column(Integer, ForeignKey("sedes.id"), index=True)
    telefono = Column(String(20))
    email = Column(String(100), unique=True)
    foto = Column(String)
    estado = Column(String(20), default="activo")
    fecha_ingreso = Column(Date)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    horarios = relationship("HorarioEspecialista", back_populates="especialista", cascade="all, delete-orphan")
    bloqueos = relationship("BloqueoEspecialista", back_populates="especialista", cascade="all, delete-orphan")
    servicios = relationship("EspecialistaServicio", back_populates="especialista", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("estado IN ('activo', 'inactivo')", name="chk_especialista_estado"),
    )


class HorarioEspecialista(Base):
    __tablename__ = "horarios_especialista"

    id = Column(Integer, primary_key=True, index=True)
    especialista_id = Column(Integer, ForeignKey("especialistas.id", ondelete="CASCADE"), nullable=False)
    dia_semana = Column(SmallInteger, nullable=False)  # 0=Domingo, 6=Sábado
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    especialista = relationship("Especialista", back_populates="horarios")

    __table_args__ = (
        CheckConstraint("dia_semana BETWEEN 0 AND 6", name="chk_dia_semana"),
        CheckConstraint("hora_fin > hora_inicio", name="chk_horario_valido"),
    )


class BloqueoEspecialista(Base):
    __tablename__ = "bloqueos_especialista"

    id = Column(Integer, primary_key=True, index=True)
    especialista_id = Column(Integer, ForeignKey("especialistas.id", ondelete="CASCADE"), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    hora_inicio = Column(Time)
    hora_fin = Column(Time)
    motivo = Column(String(255))
    es_recurrente = Column(Boolean, default=False)
    dias_semana = Column(JSON)  # Array de días [0,1,2,3,4,5,6]
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    especialista = relationship("Especialista", back_populates="bloqueos")

    __table_args__ = (
        CheckConstraint("fecha_fin >= fecha_inicio", name="chk_fecha_bloqueo"),
    )


class EspecialistaServicio(Base):
    __tablename__ = "especialista_servicios"

    especialista_id = Column(Integer, ForeignKey("especialistas.id", ondelete="CASCADE"), primary_key=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id", ondelete="CASCADE"), primary_key=True)
    tipo_comision = Column(String(20), nullable=False)  # 'porcentaje' o 'fijo'
    valor_comision = Column(DECIMAL(12, 2), nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    especialista = relationship("Especialista", back_populates="servicios")
    servicio = relationship("Servicio", back_populates="especialistas")

    __table_args__ = (
        CheckConstraint("tipo_comision IN ('porcentaje', 'fijo')", name="chk_tipo_comision"),
        CheckConstraint("valor_comision >= 0", name="chk_valor_comision_positivo"),
    )
