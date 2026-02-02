from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Numeric, CheckConstraint, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Proveedor(Base):
    """
    Modelo de proveedores de productos.
    Tabla: proveedores
    """
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False, index=True)
    contacto = Column(String(100))
    telefono = Column(String(20))
    email = Column(String(100))
    direccion = Column(Text)
    notas = Column(Text)
    
    # Estado
    estado = Column(String(20), default='activo', index=True)
    
    # Timestamps
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    productos = relationship("Producto", back_populates="proveedor")

    __table_args__ = (
        CheckConstraint("estado IN ('activo', 'inactivo')", name='chk_proveedor_estado'),
    )

    def __repr__(self):
        return f"<Proveedor(id={self.id}, nombre='{self.nombre}', estado='{self.estado}')>"


class Producto(Base):
    """
    Modelo de productos del salón.
    Tabla: productos
    """
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, index=True)  # SKU
    codigo_barras = Column(String(50), unique=True, index=True)
    nombre = Column(String(150), nullable=False, index=True)
    sede_id = Column(Integer, ForeignKey("sedes.id"), index=True)
    descripcion = Column(Text)
    
    # Categoría
    categoria_id = Column(Integer)
    
    # Proveedor
    proveedor_id = Column(Integer, ForeignKey("proveedores.id", ondelete="SET NULL"))
    
    # Precios
    precio_compra = Column(Numeric(12, 2), default=0)
    precio_venta = Column(Numeric(12, 2), nullable=False)
    
    # Stock
    stock_actual = Column(Numeric(12, 3), default=0)
    stock_minimo = Column(Numeric(12, 3), default=0)
    stock_maximo = Column(Integer)
    unidad_medida = Column(String(20), default='unidad')
    
    # Comisión por venta del producto
    comision_venta = Column(Numeric(5, 2), default=0)  # Porcentaje de comisión
    
    # Estado
    estado = Column(String(20), default='activo', index=True)
    
    # Información adicional
    fecha_vencimiento = Column(Date)
    lote = Column(String(50))
    imagen_url = Column(String(500))
    
    # Timestamps
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    proveedor = relationship("Proveedor", back_populates="productos")
    inventarios = relationship("Inventario", back_populates="producto", cascade="all, delete-orphan")
    movimientos = relationship("MovimientoInventario", back_populates="producto", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("estado IN ('activo', 'inactivo')", name='productos_estado_check'),
        CheckConstraint("precio_compra >= 0", name='productos_precio_compra_check'),
        CheckConstraint("precio_venta >= 0", name='productos_precio_venta_check'),
    )

    @property
    def margen_ganancia(self) -> float:
        """Calcula el margen de ganancia porcentual"""
        if self.precio_compra and self.precio_compra > 0:
            return float((self.precio_venta - self.precio_compra) / self.precio_compra * 100)
        return 0.0
    
    @property
    def stock_total(self) -> float:
        """Retorna el stock actual (alias para compatibilidad)"""
        return float(self.stock_actual or 0)

    def __repr__(self):
        return f"<Producto(id={self.id}, codigo='{self.codigo}', nombre='{self.nombre}')>"


class UbicacionInventario(Base):
    """
    Modelo de ubicaciones de inventario (Bodega, Vitrina, etc.).
    Tabla: ubicaciones_inventario
    """
    __tablename__ = "ubicaciones_inventario"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True, index=True)
    sede_id = Column(Integer, ForeignKey("sedes.id"), index=True)
    tipo = Column(String(50), nullable=False)  # bodega, vitrina, otro
    descripcion = Column(Text)
    es_principal = Column(Integer, default=0)  # 1 = principal, 0 = no. Solo una puede ser principal
    
    # Estado
    estado = Column(String(20), default='activo')
    
    # Timestamps
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    inventarios = relationship("Inventario", back_populates="ubicacion")
    movimientos_origen = relationship("MovimientoInventario", foreign_keys="MovimientoInventario.ubicacion_origen_id", back_populates="ubicacion_origen")
    movimientos_destino = relationship("MovimientoInventario", foreign_keys="MovimientoInventario.ubicacion_destino_id", back_populates="ubicacion_destino")

    __table_args__ = (
        CheckConstraint("tipo IN ('bodega', 'vitrina', 'otro')", name='chk_ubicacion_tipo'),
        CheckConstraint("estado IN ('activo', 'inactivo')", name='chk_ubicacion_estado'),
        CheckConstraint("es_principal IN (0, 1)", name='chk_ubicacion_es_principal'),
    )

    def __repr__(self):
        return f"<UbicacionInventario(id={self.id}, nombre='{self.nombre}', tipo='{self.tipo}')>"


class Inventario(Base):
    """
    Modelo de inventario por producto y ubicación.
    Tabla: inventario
    """
    __tablename__ = "inventario"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    ubicacion_id = Column(Integer, ForeignKey("ubicaciones_inventario.id", ondelete="CASCADE"), nullable=False)
    cantidad = Column(Integer, nullable=False, default=0)
    
    # Timestamps
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    producto = relationship("Producto", back_populates="inventarios")
    ubicacion = relationship("UbicacionInventario", back_populates="inventarios")

    __table_args__ = (
        UniqueConstraint('producto_id', 'ubicacion_id', name='uq_inventario_producto_ubicacion'),
        CheckConstraint("cantidad >= 0", name='chk_inventario_cantidad'),
        Index('ix_inventario_producto_ubicacion', 'producto_id', 'ubicacion_id'),
    )

    def __repr__(self):
        return f"<Inventario(producto_id={self.producto_id}, ubicacion_id={self.ubicacion_id}, cantidad={self.cantidad})>"


class MovimientoInventario(Base):
    """
    Modelo de movimientos de inventario.
    Tabla: movimientos_inventario
    
    Tipos de movimiento:
    - compra: Entrada por compra a proveedor
    - venta: Salida por venta al cliente
    - ajuste_positivo: Corrección manual aumentando stock
    - ajuste_negativo: Corrección manual disminuyendo stock
    - transferencia: Movimiento entre ubicaciones
    - uso_interno: Consumo del salón
    - devolucion: Devolución de cliente
    - merma: Pérdida, daño o vencimiento
    - muestra: Entrega de muestra gratuita
    - donacion: Donación de producto
    """
    __tablename__ = "movimientos_inventario"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    tipo_movimiento = Column(String(30), nullable=False, index=True)
    cantidad = Column(Integer, nullable=False)
    
    # Ubicaciones
    ubicacion_origen_id = Column(Integer, ForeignKey("ubicaciones_inventario.id", ondelete="SET NULL"))
    ubicacion_destino_id = Column(Integer, ForeignKey("ubicaciones_inventario.id", ondelete="SET NULL"))
    
    # Referencia a venta (para movimientos tipo 'venta')
    venta_id = Column(Integer)  # Foreign key a tabla de ventas cuando exista
    
    # Costos
    costo_unitario = Column(Numeric(10, 2))
    costo_total = Column(Numeric(10, 2))
    
    # Información adicional
    motivo = Column(Text)
    referencia = Column(String(100))  # Número de factura, orden, etc.
    
    # Usuario que ejecutó el movimiento
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=False)
    
    # Timestamp
    fecha_movimiento = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relaciones
    producto = relationship("Producto", back_populates="movimientos")
    ubicacion_origen = relationship("UbicacionInventario", foreign_keys=[ubicacion_origen_id], back_populates="movimientos_origen")
    ubicacion_destino = relationship("UbicacionInventario", foreign_keys=[ubicacion_destino_id], back_populates="movimientos_destino")
    usuario = relationship("Usuario")

    __table_args__ = (
        CheckConstraint(
            "tipo_movimiento IN ('compra', 'venta', 'ajuste_positivo', 'ajuste_negativo', 'transferencia', 'uso_interno', 'devolucion', 'merma', 'muestra', 'donacion')",
            name='chk_movimiento_tipo'
        ),
        CheckConstraint("cantidad > 0", name='chk_movimiento_cantidad'),
        Index('ix_movimientos_producto_fecha', 'producto_id', 'fecha_movimiento'),
        Index('ix_movimientos_tipo_fecha', 'tipo_movimiento', 'fecha_movimiento'),
    )

    def __repr__(self):
        return f"<MovimientoInventario(id={self.id}, tipo='{self.tipo_movimiento}', producto_id={self.producto_id}, cantidad={self.cantidad})>"
