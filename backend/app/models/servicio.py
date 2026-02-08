from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, DECIMAL, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class CategoriaServicio(Base):
    __tablename__ = "categorias_servicio"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    sede_id = Column(Integer, ForeignKey("sedes.id"), index=True)
    descripcion = Column(String)
    orden_visualizacion = Column(Integer, default=0)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    servicios = relationship("Servicio", back_populates="categoria")

    __table_args__ = (
        UniqueConstraint('nombre', 'sede_id', name='uq_categoria_nombre_sede'),
    )


class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    sede_id = Column(Integer, ForeignKey("sedes.id"), index=True)
    descripcion = Column(String)
    duracion_minutos = Column(Integer, nullable=False)
    precio_base = Column(DECIMAL(12, 2), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias_servicio.id"))
    requiere_producto = Column(Boolean, default=False)
    estado = Column(String(20), default="activo")
    color_calendario = Column(String(7), default="#3498db")  # Formato HEX
    tipo_comision = Column(String(20), default="porcentaje")  # 'porcentaje' o 'fijo'
    valor_comision = Column(DECIMAL(12, 2), default=40)  # Porcentaje o valor fijo en pesos
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    categoria = relationship("CategoriaServicio", back_populates="servicios")
    especialistas = relationship("EspecialistaServicio", back_populates="servicio")

    __table_args__ = (
        CheckConstraint("duracion_minutos >= 15", name="chk_duracion_minima"),
        CheckConstraint("precio_base >= 0", name="chk_precio_positivo"),
        CheckConstraint("estado IN ('activo', 'inactivo')", name="chk_servicio_estado"),
        CheckConstraint("tipo_comision IN ('porcentaje', 'fijo')", name="chk_tipo_comision"),
        CheckConstraint("valor_comision >= 0", name="chk_valor_comision_positivo"),
    )

