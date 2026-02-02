from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..database import Base


class EstadoCita(str, enum.Enum):
    AGENDADA = "agendada"
    CONFIRMADA = "confirmada"
    CLIENTE_LLEGO = "cliente_llego"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"
    NO_SHOW = "no_show"


class Cita(Base):
    """
    Modelo para citas/reservas de servicios.
    Tabla: citas
    """
    __tablename__ = "citas"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relaciones principales
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False, index=True)
    especialista_id = Column(Integer, ForeignKey("especialistas.id"), nullable=False, index=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=False, index=True)
    sede_id = Column(Integer, ForeignKey("sedes.id"), nullable=True, index=True)
    
    # Fecha y hora
    fecha = Column(Date, nullable=False, index=True)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    duracion_minutos = Column(Integer, nullable=False)
    
    # Estado y notas
    estado = Column(String(20), default="agendada", index=True)
    notas = Column(Text)
    notas_internas = Column(Text)  # Notas solo visibles para el personal
    
    # Precio (puede diferir del precio base del servicio)
    precio = Column(Integer, default=0)  # En centavos
    
    # Timestamps
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    cliente = relationship("Cliente", backref="citas")
    especialista = relationship("Especialista", backref="citas")
    servicio = relationship("Servicio", backref="citas")

    def __repr__(self):
        return f"<Cita(id={self.id}, cliente_id={self.cliente_id}, fecha={self.fecha}, hora={self.hora_inicio})>"
