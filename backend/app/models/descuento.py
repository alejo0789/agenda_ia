from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Descuento(Base):
    __tablename__ = "descuentos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    codigo = Column(String(50), unique=True, index=True, nullable=True)
    descripcion = Column(Text, nullable=True)
    
    # Tipo de descuento: 'porcentaje' o 'monto_fijo'
    tipo = Column(String(20), nullable=False, default='porcentaje')
    valor = Column(Numeric(10, 2), nullable=False)
    
    # Estado
    activo = Column(Boolean, default=True)
    
    # Validez opcional
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_fin = Column(DateTime, nullable=True)
    
    # Sede (opcional, si es nulo aplica a todas)
    sede_id = Column(Integer, ForeignKey("sedes.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Descuento(nombre={self.nombre}, tipo={self.tipo}, valor={self.valor})>"
