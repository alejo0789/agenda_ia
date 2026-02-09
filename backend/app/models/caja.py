"""
Modelos SQLAlchemy para el módulo de Caja (POS)

Incluye:
- Caja: Control de apertura/cierre de cajas
- MetodoPago: Catálogo de métodos de pago
- Factura: Encabezado de facturas
- DetalleFactura: Líneas de detalle de factura
- PagoFactura: Pagos aplicados a facturas (soporte múltiple)
- MovimientoCaja: Ingresos/egresos de efectivo
- FacturaPendiente: Servicios registrados por especialistas
- Configuracion: Parámetros del sistema
"""
from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, ForeignKey, Text, Date, CheckConstraint, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from decimal import Decimal
from ..database import Base


class Caja(Base):
    """
    Control de apertura y cierre de cajas.
    Tabla: cajas
    """
    __tablename__ = "cajas"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), default='Principal')
    sede_id = Column(Integer, ForeignKey("sedes.id"), index=True)
    
    # Apertura
    usuario_apertura = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_apertura = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    monto_apertura = Column(DECIMAL(12, 2), nullable=False, default=0)
    
    # Cierre
    usuario_cierre = Column(Integer, ForeignKey("usuarios.id"))
    fecha_cierre = Column(TIMESTAMP)
    monto_cierre = Column(DECIMAL(12, 2))
    
    # Estado
    estado = Column(String(20), nullable=False, default='abierta')
    
    # Notas
    notas = Column(Text)
    
    # Constraints
    __table_args__ = (
        CheckConstraint("estado IN ('abierta', 'cerrada')", name='cajas_estado_check'),
    )
    
    # Relaciones
    usuario_apertura_rel = relationship("Usuario", foreign_keys=[usuario_apertura])
    usuario_cierre_rel = relationship("Usuario", foreign_keys=[usuario_cierre])
    sede = relationship("Sede")
    facturas = relationship("Factura", back_populates="caja")
    movimientos = relationship("MovimientoCaja", back_populates="caja", cascade="all, delete-orphan")
    
    @property
    def total_efectivo_teorico(self) -> Decimal:
        """Calcula el efectivo teórico en caja"""
        ingresos = sum(Decimal(str(m.monto)) for m in self.movimientos if m.tipo == 'ingreso')
        egresos = sum(Decimal(str(m.monto)) for m in self.movimientos if m.tipo == 'egreso')
        return Decimal(str(self.monto_apertura or 0)) + ingresos - egresos
    
    @property
    def diferencia(self) -> Decimal:
        """Calcula la diferencia entre efectivo real y teórico al cierre"""
        if self.estado == 'cerrada' and self.monto_cierre is not None:
            return Decimal(str(self.monto_cierre)) - self.total_efectivo_teorico
        return Decimal(0)
    
    def __repr__(self):
        return f"<Caja(id={self.id}, nombre='{self.nombre}', estado='{self.estado}')>"


class MetodoPago(Base):
    """
    Catálogo de métodos de pago.
    Tabla: metodos_pago
    """
    __tablename__ = "metodos_pago"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)
    activo = Column(Boolean, default=True)  # Boolean en BD Postgres
    requiere_referencia = Column(Boolean, default=False)  # Boolean en BD Postgres
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    pagos = relationship("PagoFactura", back_populates="metodo_pago")
    
    def __repr__(self):
        return f"<MetodoPago(id={self.id}, nombre='{self.nombre}', activo={self.activo})>"


class Factura(Base):
    """
    Encabezado de facturas.
    Tabla: facturas
    """
    __tablename__ = "facturas"
    
    id = Column(Integer, primary_key=True, index=True)
    numero_factura = Column(String(50), nullable=False, unique=True, index=True)
    sede_id = Column(Integer, ForeignKey("sedes.id"), index=True)
    
    # Cliente (opcional para ventas rápidas)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    
    # Fecha
    fecha = Column(TIMESTAMP, nullable=False, server_default=func.current_timestamp())
    
    # Montos
    subtotal = Column(DECIMAL(12, 2), nullable=False, default=0)
    descuento = Column(DECIMAL(12, 2), default=0)
    impuestos = Column(DECIMAL(12, 2), default=0)
    total = Column(DECIMAL(12, 2), nullable=False, default=0)
    
    # LEGACY: Mantener para facturas antiguas
    metodo_pago_id = Column(Integer, ForeignKey("metodos_pago.id"))
    referencia_pago = Column(String(100))
    
    # Estado
    estado = Column(String(20), nullable=False, default='pagada')
    
    # Auditoría
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    caja_id = Column(Integer, ForeignKey("cajas.id"))
    
    # Notas
    notas = Column(Text)
    
    # Timestamp
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("estado IN ('pendiente', 'pagada', 'anulada')", name='facturas_estado_check'),
    )
    
    # Relaciones
    cliente = relationship("Cliente", backref="facturas")
    usuario = relationship("Usuario")
    sede = relationship("Sede")
    caja = relationship("Caja", back_populates="facturas")
    detalle = relationship("DetalleFactura", back_populates="factura", cascade="all, delete-orphan")
    pagos = relationship("PagoFactura", back_populates="factura", cascade="all, delete-orphan")
    movimientos_caja = relationship("MovimientoCaja", back_populates="factura")
    metodo_pago = relationship("MetodoPago")  # LEGACY
    
    @property
    def total_pagado(self) -> Decimal:
        """Suma de todos los pagos aplicados"""
        return sum(Decimal(str(pago.monto)) for pago in self.pagos)
    
    @property
    def saldo_pendiente(self) -> Decimal:
        """Saldo pendiente de pago"""
        return Decimal(str(self.total)) - self.total_pagado
    
    @property
    def esta_totalmente_pagada(self) -> bool:
        """Verifica si la factura está completamente pagada"""
        return self.saldo_pendiente == 0
    
    @property
    def total_servicios(self) -> Decimal:
        """Total de servicios facturados"""
        return sum(Decimal(str(d.subtotal)) for d in self.detalle if d.tipo == 'servicio')
    
    @property
    def total_productos(self) -> Decimal:
        """Total de productos facturados"""
        return sum(Decimal(str(d.subtotal)) for d in self.detalle if d.tipo == 'producto')

    @property
    def abonos_aplicados(self):
        """Alias para redenciones de abonos (compatibilidad con schema)"""
        from .abono import RedencionAbono # Import local para evitar circular
        return self.redenciones_abono
    
    def __repr__(self):
        return f"<Factura(id={self.id}, numero='{self.numero_factura}', total={self.total}, estado='{self.estado}')>"


class DetalleFactura(Base):
    """
    Líneas de detalle de factura.
    Tabla: detalle_factura
    """
    __tablename__ = "detalle_factura"
    
    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False)
    
    # Tipo de ítem
    tipo = Column(String(20), nullable=False)  # 'servicio' o 'producto'
    item_id = Column(Integer, nullable=False)  # ID del servicio o producto
    
    # Cantidades y precios
    cantidad = Column(DECIMAL(12, 3), nullable=False, default=1)
    precio_unitario = Column(DECIMAL(12, 2), nullable=False)
    descuento_linea = Column(DECIMAL(12, 2), default=0)
    subtotal = Column(DECIMAL(12, 2), nullable=False)
    
    # Asignación de especialista (para comisiones)
    especialista_id = Column(Integer, ForeignKey("especialistas.id"))
    
    # Vinculación con cita (si aplica)
    cita_id = Column(Integer, ForeignKey("citas.id"))
    
    # Timestamp
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("tipo IN ('servicio', 'producto')", name='detalle_factura_tipo_check'),
        CheckConstraint("cantidad > 0", name='detalle_factura_cantidad_check'),
    )
    
    # Relaciones
    factura = relationship("Factura", back_populates="detalle")
    especialista = relationship("Especialista")
    cita = relationship("Cita")
    
    def __repr__(self):
        return f"<DetalleFactura(id={self.id}, tipo='{self.tipo}', item_id={self.item_id}, subtotal={self.subtotal})>"


class PagoFactura(Base):
    """
    Pagos aplicados a facturas (soporte para pagos múltiples/mixtos).
    Tabla: pagos_factura
    """
    __tablename__ = "pagos_factura"
    
    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False, index=True)
    metodo_pago_id = Column(Integer, ForeignKey("metodos_pago.id"), nullable=False)
    
    # Monto y referencia
    monto = Column(DECIMAL(12, 2), nullable=False)
    referencia_pago = Column(String(100))
    
    # Auditoría
    fecha_pago = Column(TIMESTAMP, server_default=func.current_timestamp())
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    # Constraint
    __table_args__ = (
        CheckConstraint("monto > 0", name='chk_pago_monto_positivo'),
    )
    
    # Relaciones
    factura = relationship("Factura", back_populates="pagos")
    metodo_pago = relationship("MetodoPago", back_populates="pagos")
    usuario = relationship("Usuario")
    
    def __repr__(self):
        return f"<PagoFactura(id={self.id}, factura_id={self.factura_id}, monto={self.monto})>"


class MovimientoCaja(Base):
    """
    Registro de ingresos y egresos de efectivo.
    Tabla: movimientos_caja
    """
    __tablename__ = "movimientos_caja"
    
    id = Column(Integer, primary_key=True, index=True)
    caja_id = Column(Integer, ForeignKey("cajas.id"), nullable=False)
    
    # Tipo de movimiento
    tipo = Column(String(20), nullable=False)  # 'ingreso' o 'egreso'
    monto = Column(DECIMAL(12, 2), nullable=False)
    concepto = Column(String(255), nullable=False)
    
    # Referencia a factura (si aplica)
    factura_id = Column(Integer, ForeignKey("facturas.id"))
    
    # Auditoría
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("tipo IN ('ingreso', 'egreso')", name='movimientos_caja_tipo_check'),
    )
    
    # Relaciones
    caja = relationship("Caja", back_populates="movimientos")
    factura = relationship("Factura", back_populates="movimientos_caja")
    usuario = relationship("Usuario")
    
    def __repr__(self):
        return f"<MovimientoCaja(id={self.id}, tipo='{self.tipo}', monto={self.monto}, concepto='{self.concepto}')>"


class FacturaPendiente(Base):
    """
    Servicios pendientes registrados por especialistas.
    Tabla: facturas_pendientes
    """
    __tablename__ = "facturas_pendientes"
    
    id = Column(Integer, primary_key=True, index=True)
    sede_id = Column(Integer, ForeignKey("sedes.id"), index=True)
    
    # Especialista que registró el servicio
    especialista_id = Column(Integer, ForeignKey("especialistas.id"), nullable=False)
    
    # Cliente (opcional)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    
    # Tipo de ítem
    tipo = Column(String(20), nullable=False, default='servicio')
    
    # Servicio o Producto realizado
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=True)
    
    cantidad = Column(DECIMAL(12, 3), nullable=False, default=1)
    fecha_servicio = Column(Date, nullable=False, server_default=func.current_date())
    # Notas
    notas = Column(Text)
    
    # Estado
    estado = Column(String(20), nullable=False, default='pendiente')
    
    # Revisión
    revisado_por = Column(Integer, ForeignKey("usuarios.id"))
    fecha_revision = Column(TIMESTAMP)
    motivo_rechazo = Column(Text)
    
    # Timestamp
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("estado IN ('pendiente', 'aprobada', 'rechazada', 'facturada')", name='facturas_pendientes_estado_check'),
    )
    
    # Relaciones
    especialista = relationship("Especialista")
    cliente = relationship("Cliente", backref="facturas_pendientes")
    servicio = relationship("Servicio")
    producto = relationship("Producto")
    revisor = relationship("Usuario", foreign_keys=[revisado_por])
    sede = relationship("Sede")
    
    def __repr__(self):
        item_id = self.servicio_id if self.tipo == 'servicio' else self.producto_id
        return f"<FacturaPendiente(id={self.id}, tipo='{self.tipo}', item_id={item_id}, estado='{self.estado}')>"


class Configuracion(Base):
    """
    Parámetros del sistema.
    Tabla: configuracion
    """
    __tablename__ = "configuracion"
    
    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(100), nullable=False, unique=True, index=True)
    valor = Column(Text)
    tipo = Column(String(20), nullable=False, default='texto')  # 'texto', 'numero', 'booleano', 'json'
    descripcion = Column(Text)
    fecha_actualizacion = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("tipo IN ('texto', 'numero', 'booleano', 'json')", name='configuracion_tipo_check'),
    )
    
    @property
    def valor_parseado(self):
        """Devuelve el valor en el tipo correcto"""
        if self.tipo == 'numero':
            return float(self.valor) if self.valor else 0
        elif self.tipo == 'booleano':
            return self.valor.lower() in ('true', '1', 'yes', 'si') if self.valor else False
        elif self.tipo == 'json':
            import json
            return json.loads(self.valor) if self.valor else {}
        return self.valor
    
    def __repr__(self):
        return f"<Configuracion(clave='{self.clave}', valor='{self.valor}')>"
