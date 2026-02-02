from sqlalchemy import Column, Integer, String, Date, Text, DateTime, CheckConstraint, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import JSON

from sqlalchemy.sql import func
from ..database import Base


class Cliente(Base):
    """
    Modelo principal de clientes del salón.
    Tabla: clientes
    """
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    apellido = Column(String(100), index=True)
    cedula = Column(String(20), unique=True, index=True)  # Cédula/Documento de identidad
    sede_id = Column(Integer, ForeignKey("sedes.id"), index=True)
    telefono = Column(String(20), index=True)
    email = Column(String(100), index=True)
    
    # Información adicional
    fecha_nacimiento = Column(Date)
    direccion = Column(Text)
    notas = Column(Text)
    
    # Estadísticas (actualizadas por triggers en BD)
    fecha_primera_visita = Column(Date)
    ultima_visita = Column(Date)
    total_visitas = Column(Integer, default=0)
    
    # Estado y control
    estado = Column(String(20), default='activo')
    
    # Timestamps
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    preferencias = relationship("ClientePreferencia", back_populates="cliente", uselist=False, cascade="all, delete-orphan")
    etiquetas_asignadas = relationship("ClienteEtiquetaAsignacion", back_populates="cliente", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("estado IN ('activo', 'inactivo')", name='chk_cliente_estado'),
    )

    @property
    def nombre_completo(self) -> str:
        """Genera nombre completo concatenando nombre y apellido"""
        if self.apellido:
            return f"{self.nombre} {self.apellido}"
        return self.nombre

    def __repr__(self):
        return f"<Cliente(id={self.id}, nombre='{self.nombre_completo}', estado='{self.estado}')>"


class ClientePreferencia(Base):
    """
    Preferencias y notas de servicio del cliente.
    Tabla: cliente_preferencias
    """
    __tablename__ = "cliente_preferencias"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Preferencias (JSONB para productos favoritos)
    productos_favoritos = Column(JSON)  # Array de IDs: [1, 5, 12]
    alergias = Column(Text)
    notas_servicio = Column(Text)
    
    # Timestamp
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relación
    cliente = relationship("Cliente", back_populates="preferencias")

    def __repr__(self):
        return f"<ClientePreferencia(cliente_id={self.cliente_id})>"


class ClienteEtiqueta(Base):
    """
    Catálogo de etiquetas para segmentación de clientes.
    Tabla: cliente_etiquetas
    """
    __tablename__ = "cliente_etiquetas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True, index=True)
    color = Column(String(7), default='#6c757d')  # HEX color
    
    # Timestamp
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relación (a través de tabla asociativa)
    asignaciones = relationship("ClienteEtiquetaAsignacion", back_populates="etiqueta", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ClienteEtiqueta(id={self.id}, nombre='{self.nombre}')>"


class ClienteEtiquetaAsignacion(Base):
    """
    Tabla de relación entre clientes y etiquetas.
    Tabla: cliente_etiqueta_asignacion
    """
    __tablename__ = "cliente_etiqueta_asignacion"

    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), primary_key=True)
    etiqueta_id = Column(Integer, ForeignKey("cliente_etiquetas.id", ondelete="CASCADE"), primary_key=True)
    fecha_asignacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    cliente = relationship("Cliente", back_populates="etiquetas_asignadas")
    etiqueta = relationship("ClienteEtiqueta", back_populates="asignaciones")

    def __repr__(self):
        return f"<ClienteEtiquetaAsignacion(cliente_id={self.cliente_id}, etiqueta_id={self.etiqueta_id})>"
