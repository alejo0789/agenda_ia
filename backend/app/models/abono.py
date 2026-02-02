"""
Modelo SQLAlchemy para Abonos de Clientes

Los abonos son pagos anticipados que los clientes realizan,
generalmente al agendar una cita, y que pueden ser redimidos
al momento de facturar.
"""
from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from decimal import Decimal
from ..database import Base


class Abono(Base):
    """
    Registro de abonos/pagos anticipados de clientes.
    Tabla: abonos
    """
    __tablename__ = "abonos"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Cliente que realizó el abono
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False, index=True)
    
    # Monto del abono
    monto = Column(DECIMAL(12, 2), nullable=False)
    
    # Saldo disponible (puede ser menor al monto si se ha usado parcialmente)
    saldo_disponible = Column(DECIMAL(12, 2), nullable=False)
    
    # Cita asociada (opcional - el abono puede ser independiente)
    cita_id = Column(Integer, ForeignKey("citas.id"), nullable=True, index=True)
    
    # Método de pago usado para el abono
    metodo_pago_id = Column(Integer, ForeignKey("metodos_pago.id"), nullable=False)
    
    # Referencia del pago (si aplica)
    referencia_pago = Column(String(100))
    
    # Estado del abono
    # - disponible: tiene saldo para usar
    # - usado: se consumió completamente
    # - anulado: fue cancelado/reembolsado
    estado = Column(String(20), nullable=False, default='disponible')
    
    # Notas/concepto
    concepto = Column(Text)
    
    # Auditoría
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    fecha_actualizacion = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("monto > 0", name='abonos_monto_positivo'),
        CheckConstraint("saldo_disponible >= 0", name='abonos_saldo_positivo'),
        CheckConstraint("saldo_disponible <= monto", name='abonos_saldo_menor_monto'),
        CheckConstraint("estado IN ('disponible', 'usado', 'anulado')", name='abonos_estado_check'),
    )
    
    # Relaciones
    cliente = relationship("Cliente", backref="abonos")
    cita = relationship("Cita", backref="abonos")
    metodo_pago = relationship("MetodoPago")
    usuario = relationship("Usuario")
    redenciones = relationship("RedencionAbono", back_populates="abono", cascade="all, delete-orphan")
    
    @property
    def esta_disponible(self) -> bool:
        """Verifica si el abono tiene saldo disponible"""
        return self.estado == 'disponible' and Decimal(str(self.saldo_disponible)) > 0
    
    def __repr__(self):
        return f"<Abono(id={self.id}, cliente_id={self.cliente_id}, monto={self.monto}, saldo={self.saldo_disponible}, estado='{self.estado}')>"


class RedencionAbono(Base):
    """
    Registro de uso de abonos en facturas.
    Permite trackear cuándo y cuánto se usó de cada abono.
    Tabla: redenciones_abono
    """
    __tablename__ = "redenciones_abono"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Abono que se está usando
    abono_id = Column(Integer, ForeignKey("abonos.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Factura donde se aplicó
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Monto aplicado
    monto_aplicado = Column(DECIMAL(12, 2), nullable=False)
    
    # Timestamp
    fecha_aplicacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("monto_aplicado > 0", name='redenciones_monto_positivo'),
    )
    
    # Relaciones
    abono = relationship("Abono", back_populates="redenciones")
    factura = relationship("Factura", backref="redenciones_abono")
    
    def __repr__(self):
        return f"<RedencionAbono(id={self.id}, abono_id={self.abono_id}, factura_id={self.factura_id}, monto={self.monto_aplicado})>"
