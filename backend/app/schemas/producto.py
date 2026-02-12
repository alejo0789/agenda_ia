from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
import re
from enum import Enum


# ============================================
# ENUMS
# ============================================

class EstadoProducto(str, Enum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    DESCONTINUADO = "descontinuado"


class EstadoProveedor(str, Enum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"


class TipoUbicacion(str, Enum):
    BODEGA = "bodega"
    VITRINA = "vitrina"
    OTRO = "otro"


class TipoMovimiento(str, Enum):
    COMPRA = "compra"
    VENTA = "venta"
    AJUSTE_POSITIVO = "ajuste_positivo"
    AJUSTE_NEGATIVO = "ajuste_negativo"
    TRANSFERENCIA = "transferencia"
    USO_INTERNO = "uso_interno"
    DEVOLUCION = "devolucion"
    MERMA = "merma"
    MUESTRA = "muestra"
    DONACION = "donacion"


# ============================================
# SCHEMAS DE PROVEEDOR
# ============================================

class ProveedorBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=200, description="Nombre del proveedor")
    contacto: Optional[str] = Field(None, max_length=100, description="Persona de contacto")
    telefono: Optional[str] = Field(None, max_length=20, description="Teléfono de contacto")
    email: Optional[EmailStr] = Field(None, description="Email del proveedor")
    direccion: Optional[str] = Field(None, description="Dirección física")
    notas: Optional[str] = Field(None, description="Notas adicionales")

    @field_validator('telefono')
    @classmethod
    def validar_telefono(cls, v):
        if v is None:
            return v
        telefono_limpio = re.sub(r'[\s\-\(\)]', '', v)
        if not re.match(r'^\+?\d{7,15}$', telefono_limpio):
            raise ValueError('Formato de teléfono inválido. Debe contener entre 7 y 15 dígitos.')
        return telefono_limpio


class ProveedorCreate(ProveedorBase):
    """Schema para crear un nuevo proveedor"""
    pass


class ProveedorUpdate(BaseModel):
    """Schema para actualizar un proveedor existente"""
    nombre: Optional[str] = Field(None, min_length=2, max_length=200)
    contacto: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None
    estado: Optional[EstadoProveedor] = None

    @field_validator('telefono')
    @classmethod
    def validar_telefono(cls, v):
        if v is None:
            return v
        telefono_limpio = re.sub(r'[\s\-\(\)]', '', v)
        if not re.match(r'^\+?\d{7,15}$', telefono_limpio):
            raise ValueError('Formato de teléfono inválido')
        return telefono_limpio


class ProveedorResponse(ProveedorBase):
    """Schema de respuesta de proveedor"""
    id: int
    estado: str
    total_productos: int = 0  # Calculado en servicio
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True


class ProveedorListResponse(BaseModel):
    """Schema de respuesta para listados de proveedores"""
    id: int
    nombre: str
    contacto: Optional[str]
    telefono: Optional[str]
    email: Optional[str]
    estado: str
    total_productos: int = 0

    class Config:
        from_attributes = True


# ============================================
# SCHEMAS DE UBICACIÓN
# ============================================

class UbicacionBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre de la ubicación")
    tipo: TipoUbicacion = Field(..., description="Tipo de ubicación")
    descripcion: Optional[str] = Field(None, description="Descripción de la ubicación")
    es_principal: bool = Field(default=False, description="Si es la ubicación principal")


class UbicacionCreate(UbicacionBase):
    """Schema para crear una nueva ubicación"""
    pass


class UbicacionUpdate(BaseModel):
    """Schema para actualizar una ubicación"""
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    tipo: Optional[TipoUbicacion] = None
    descripcion: Optional[str] = None
    es_principal: Optional[bool] = None
    estado: Optional[str] = Field(None, pattern='^(activo|inactivo)$')


class UbicacionResponse(UbicacionBase):
    """Schema de respuesta de ubicación"""
    id: int
    estado: str
    total_productos: int = 0  # Calculado en servicio
    valor_total: Decimal = Decimal("0")  # Calculado en servicio
    fecha_creacion: datetime

    class Config:
        from_attributes = True


# ============================================
# SCHEMAS DE PRODUCTO
# ============================================

class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=200, description="Nombre del producto")
    codigo: Optional[str] = Field(None, max_length=50, description="Código SKU interno")
    codigo_barras: Optional[str] = Field(None, max_length=100, description="Código de barras")
    descripcion: Optional[str] = Field(None, description="Descripción del producto")
    precio_compra: Optional[Decimal] = Field(default=Decimal("0"), ge=0, description="Precio de compra (opcional)")
    precio_venta: Decimal = Field(default=Decimal("0"), ge=0, description="Precio de venta al cliente")
    precio_colaborador: Optional[Decimal] = Field(default=Decimal("0"), ge=0, description="Precio de venta para colaboradores/empleados")
    comision_porcentaje: Optional[Decimal] = Field(default=Decimal("0"), ge=0, le=100, description="Porcentaje de comisión por venta (0-100)")
    stock_minimo: int = Field(default=0, ge=0, description="Cantidad mínima deseada")
    stock_maximo: Optional[int] = Field(None, ge=0, description="Cantidad máxima deseada")
    fecha_vencimiento: Optional[date] = Field(None, description="Fecha de vencimiento")
    lote: Optional[str] = Field(None, max_length=50, description="Número de lote")
    imagen_url: Optional[str] = Field(None, max_length=500, description="URL de imagen")
    proveedor_id: Optional[int] = Field(None, description="ID del proveedor")

    @field_validator('codigo')
    @classmethod
    def validar_codigo(cls, v):
        if v is None:
            return v
        # Alfanumérico, guiones y guiones bajos permitidos
        if not re.match(r'^[A-Za-z0-9\-_]+$', v):
            raise ValueError('El código solo puede contener letras, números, guiones y guiones bajos')
        return v.upper()

    @field_validator('stock_maximo')
    @classmethod
    def validar_stock_maximo(cls, v, info):
        if v is not None:
            stock_minimo = info.data.get('stock_minimo', 0) or 0
            if v < stock_minimo:
                raise ValueError('El stock máximo debe ser mayor o igual al stock mínimo')
        return v


class ProductoCreate(ProductoBase):
    """Schema para crear un nuevo producto"""
    cantidad_inicial: Optional[int] = Field(None, ge=0, description="Cantidad inicial a ingresar")
    ubicacion_inicial_id: Optional[int] = Field(None, description="Ubicación para cantidad inicial")


class ProductoUpdate(BaseModel):
    """Schema para actualizar un producto existente"""
    nombre: Optional[str] = Field(None, min_length=2, max_length=200)
    codigo: Optional[str] = Field(None, max_length=50)
    codigo_barras: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = None
    precio_compra: Optional[Decimal] = Field(None, ge=0)
    precio_venta: Optional[Decimal] = Field(None, ge=0)
    precio_colaborador: Optional[Decimal] = Field(None, ge=0)
    comision_porcentaje: Optional[Decimal] = Field(None, ge=0, le=100)
    stock_minimo: Optional[int] = Field(None, ge=0)
    stock_maximo: Optional[int] = None
    fecha_vencimiento: Optional[date] = None
    lote: Optional[str] = Field(None, max_length=50)
    imagen_url: Optional[str] = Field(None, max_length=500)
    proveedor_id: Optional[int] = None
    estado: Optional[EstadoProducto] = None

    @field_validator('codigo')
    @classmethod
    def validar_codigo(cls, v):
        if v is None:
            return v
        if not re.match(r'^[A-Za-z0-9\-_]+$', v):
            raise ValueError('El código solo puede contener letras, números, guiones y guiones bajos')
        return v.upper()


class InventarioUbicacion(BaseModel):
    """Stock de producto en una ubicación específica"""
    ubicacion_id: int
    ubicacion_nombre: str
    cantidad: int

    class Config:
        from_attributes = True


class ProductoResponse(ProductoBase):
    """Schema de respuesta completa de producto"""
    id: int
    estado: str
    stock_total: int = 0  # Calculado
    margen_ganancia: float = 0.0  # Calculado
    inventario_por_ubicacion: List[InventarioUbicacion] = []
    proveedor_nombre: Optional[str] = None
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True


class ProductoListResponse(BaseModel):
    """Schema de respuesta para listados de productos"""
    id: int
    codigo: Optional[str]
    codigo_barras: Optional[str]
    nombre: str
    precio_compra: Decimal
    precio_venta: Decimal
    precio_colaborador: Optional[Decimal] = None
    stock_total: int = 0
    stock_minimo: int
    estado: str
    proveedor_nombre: Optional[str] = None
    alerta_stock_bajo: bool = False

    class Config:
        from_attributes = True


class ProductoPaginado(BaseModel):
    """Respuesta paginada de productos"""
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int
    items: List[ProductoListResponse]


# ============================================
# SCHEMAS DE INVENTARIO
# ============================================

class InventarioResponse(BaseModel):
    """Schema de respuesta de inventario"""
    id: int
    producto_id: int
    producto_nombre: str
    producto_codigo: Optional[str]
    ubicacion_id: int
    ubicacion_nombre: str
    cantidad: int
    precio_venta: Decimal
    valor_total: Decimal  # cantidad * precio_venta
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True


class AjusteInventarioRequest(BaseModel):
    """Request para ajustar inventario manualmente"""
    producto_id: int = Field(..., description="ID del producto")
    ubicacion_id: int = Field(..., description="ID de la ubicación")
    cantidad_nueva: int = Field(..., ge=0, description="Cantidad final deseada")
    motivo: str = Field(..., min_length=5, description="Justificación del ajuste")


class TransferenciaRequest(BaseModel):
    """Request para transferir entre ubicaciones"""
    producto_id: int = Field(..., description="ID del producto")
    ubicacion_origen_id: int = Field(..., description="ID de ubicación origen")
    ubicacion_destino_id: int = Field(..., description="ID de ubicación destino")
    cantidad: int = Field(..., gt=0, description="Cantidad a transferir")
    motivo: Optional[str] = Field(None, description="Motivo de la transferencia")

    @field_validator('ubicacion_destino_id')
    @classmethod
    def validar_ubicaciones_diferentes(cls, v, info):
        origen = info.data.get('ubicacion_origen_id')
        if origen and v == origen:
            raise ValueError('La ubicación destino debe ser diferente a la ubicación origen')
        return v


class ConteoFisicoItem(BaseModel):
    """Item individual de conteo físico"""
    producto_id: int
    ubicacion_id: int
    cantidad_fisica: int = Field(..., ge=0)


class ConteoFisicoRequest(BaseModel):
    """Request para conteo físico masivo"""
    conteos: List[ConteoFisicoItem]
    motivo: str = Field(default="Inventario físico", min_length=5)


class ConteoFisicoResultado(BaseModel):
    """Resultado de un conteo individual"""
    producto_id: int
    ubicacion_id: int
    cantidad_sistema: int
    cantidad_fisica: int
    diferencia: int
    ajuste_realizado: bool


class ConteoFisicoResponse(BaseModel):
    """Respuesta del conteo físico"""
    productos_procesados: int
    ajustes_realizados: int
    sin_cambios: int
    resultados: List[ConteoFisicoResultado]


# ============================================
# SCHEMAS DE MOVIMIENTO
# ============================================

class MovimientoBase(BaseModel):
    producto_id: int = Field(..., description="ID del producto")
    tipo_movimiento: TipoMovimiento = Field(..., description="Tipo de movimiento")
    cantidad: int = Field(..., gt=0, description="Cantidad del movimiento")
    ubicacion_origen_id: Optional[int] = Field(None, description="ID de ubicación origen")
    ubicacion_destino_id: Optional[int] = Field(None, description="ID de ubicación destino")
    costo_unitario: Optional[Decimal] = Field(None, ge=0, description="Costo unitario")
    costo_total: Optional[Decimal] = Field(None, ge=0, description="Costo total")
    motivo: Optional[str] = Field(None, description="Descripción o justificación")
    referencia: Optional[str] = Field(None, max_length=100, description="Número de factura, orden, etc.")
    venta_id: Optional[int] = Field(None, description="ID de venta asociada")


class MovimientoCreate(MovimientoBase):
    """Schema para crear un movimiento"""
    pass


class CompraRequest(BaseModel):
    """Request simplificado para registrar compras"""
    producto_id: int = Field(..., description="ID del producto")
    cantidad: int = Field(..., gt=0, description="Cantidad comprada")
    ubicacion_destino_id: int = Field(..., description="Ubicación donde ingresa")
    costo_unitario: Decimal = Field(..., ge=0, description="Costo unitario")
    referencia: Optional[str] = Field(None, max_length=100, description="Número de factura")
    motivo: Optional[str] = Field(None, description="Notas adicionales")


class MovimientoResponse(BaseModel):
    """Schema de respuesta de movimiento"""
    id: int
    producto_id: int
    producto_nombre: str
    producto_codigo: Optional[str]
    tipo_movimiento: str
    cantidad: int
    ubicacion_origen_id: Optional[int]
    ubicacion_origen_nombre: Optional[str]
    ubicacion_destino_id: Optional[int]
    ubicacion_destino_nombre: Optional[str]
    venta_id: Optional[int]
    costo_unitario: Optional[Decimal]
    costo_total: Optional[Decimal]
    motivo: Optional[str]
    referencia: Optional[str]
    usuario_id: int
    usuario_nombre: Optional[str]
    fecha_movimiento: datetime

    class Config:
        from_attributes = True


class MovimientoPaginado(BaseModel):
    """Respuesta paginada de movimientos"""
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int
    items: List[MovimientoResponse]


# ============================================
# SCHEMAS DE OPERACIONES MASIVAS
# ============================================

class ActualizarPreciosMasivoRequest(BaseModel):
    """Request para actualizar precios masivamente"""
    productos_ids: List[int] = Field(..., min_length=1, description="Lista de IDs de productos")
    incremento_porcentaje: Optional[float] = Field(None, description="Porcentaje a aumentar/disminuir")
    incremento_fijo: Optional[Decimal] = Field(None, description="Monto fijo a aumentar/disminuir")
    aplicar_a_compra: bool = Field(default=False, description="Aplicar a precio de compra")
    aplicar_a_venta: bool = Field(default=True, description="Aplicar a precio de venta")

    @field_validator('incremento_fijo')
    @classmethod
    def validar_incremento(cls, v, info):
        porcentaje = info.data.get('incremento_porcentaje')
        if v is None and porcentaje is None:
            raise ValueError('Debe proporcionar incremento_porcentaje o incremento_fijo')
        return v


class ActualizarPreciosResultado(BaseModel):
    """Resultado de actualización de precio individual"""
    producto_id: int
    producto_nombre: str
    precio_compra_anterior: Optional[Decimal]
    precio_compra_nuevo: Optional[Decimal]
    precio_venta_anterior: Optional[Decimal]
    precio_venta_nuevo: Optional[Decimal]
    actualizado: bool
    error: Optional[str] = None


class ActualizarPreciosResponse(BaseModel):
    """Respuesta de actualización masiva de precios"""
    productos_actualizados: int
    errores: int
    resultados: List[ActualizarPreciosResultado]


# ============================================
# SCHEMAS DE REPORTES
# ============================================

class VentaProductoReporte(BaseModel):
    """Reporte de ventas por producto"""
    producto_id: int
    producto_nombre: str
    producto_codigo: Optional[str]
    cantidad_vendida: int
    monto_total: Decimal
    utilidad_total: Decimal


class ProductoPorEspecialistaReporte(BaseModel):
    """Reporte de productos vendidos por especialista"""
    especialista_id: int
    especialista_nombre: str
    producto_id: int
    producto_nombre: str
    cantidad_vendida: int
    monto_total: Decimal


class ResumenInventarioUbicacion(BaseModel):
    """Resumen de inventario por ubicación"""
    ubicacion_id: int
    ubicacion_nombre: str
    total_productos: int
    total_unidades: int
    valor_al_costo: Decimal
    valor_al_precio_venta: Decimal
    productos_stock_bajo: int
    productos_sin_stock: int


class ResumenInventarioResponse(BaseModel):
    """Respuesta del reporte de resumen de inventario"""
    ubicaciones: List[ResumenInventarioUbicacion]
    totales: dict


# ============================================
# SCHEMAS DE ALERTAS
# ============================================

class ProductoAlertaStockBajo(BaseModel):
    """Producto con stock bajo"""
    id: int
    codigo: Optional[str]
    nombre: str
    stock_total: int
    stock_minimo: int
    diferencia: int
    inventario_por_ubicacion: List[InventarioUbicacion]


class ProductoAlertaVencimiento(BaseModel):
    """Producto próximo a vencer"""
    id: int
    codigo: Optional[str]
    nombre: str
    fecha_vencimiento: date
    dias_para_vencer: int
    stock_total: int
