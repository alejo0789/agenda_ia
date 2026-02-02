"""
Schemas Pydantic para el módulo de Caja (POS)

Incluye schemas para:
- Caja (apertura, cierre, respuestas)
- Factura (crear, respuestas, anular)
- DetalleFactura
- PagoFactura
- MovimientoCaja
- FacturaPendiente
- Ventas/Reportes
"""
from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
from datetime import datetime, date
from typing import Optional, List


# ============================================
# SCHEMAS DE CAJA
# ============================================

class CajaAperturaCreate(BaseModel):
    """Schema para apertura de caja"""
    nombre: str = Field(default='Principal', max_length=50)
    monto_apertura: Decimal = Field(ge=0, description="Monto inicial en efectivo")
    notas: Optional[str] = None
    
    @field_validator('monto_apertura')
    @classmethod
    def validar_monto(cls, v):
        if v < 0:
            raise ValueError('El monto de apertura no puede ser negativo')
        return round(v, 2)
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "nombre": "Caja Principal",
                "monto_apertura": 50000.00,
                "notas": "Apertura turno mañana"
            }
        }
    }


class CajaCierreCreate(BaseModel):
    """Schema para cierre de caja"""
    monto_cierre: Decimal = Field(ge=0, description="Efectivo contado al cierre")
    notas: Optional[str] = None
    
    @field_validator('monto_cierre')
    @classmethod
    def validar_monto(cls, v):
        if v < 0:
            raise ValueError('El monto de cierre no puede ser negativo')
        return round(v, 2)


class CajaBase(BaseModel):
    """Schema base de caja"""
    id: int
    nombre: str
    estado: str
    fecha_apertura: datetime
    monto_apertura: Decimal
    
    model_config = {"from_attributes": True}


class CajaDetalle(CajaBase):
    """Schema detallado de caja con cálculos"""
    fecha_cierre: Optional[datetime] = None
    monto_cierre: Optional[Decimal] = None
    notas: Optional[str] = None
    total_efectivo_teorico: Decimal
    diferencia: Decimal
    usuario_apertura_nombre: Optional[str] = None
    usuario_cierre_nombre: Optional[str] = None


class CajaList(BaseModel):
    """Schema para listado de cajas"""
    id: int
    nombre: str
    estado: str
    fecha_apertura: datetime
    monto_apertura: Decimal
    fecha_cierre: Optional[datetime] = None
    monto_cierre: Optional[Decimal] = None
    
    model_config = {"from_attributes": True}


class CajaCuadre(BaseModel):
    """Schema para cuadre de caja"""
    caja_id: int
    nombre: str
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime] = None
    monto_apertura: Decimal
    ingresos_adicionales: Decimal
    egresos: Decimal
    efectivo_teorico: Decimal
    efectivo_real: Decimal
    diferencia: Decimal
    ventas_por_metodo: List[dict]


# ============================================
# SCHEMAS DE PAGO
# ============================================

class PagoFacturaCreate(BaseModel):
    """Schema para crear un pago"""
    metodo_pago_id: int = Field(gt=0)
    monto: Decimal = Field(gt=0, description="Monto del pago")
    referencia_pago: Optional[str] = Field(None, max_length=100)
    
    @field_validator('monto')
    @classmethod
    def validar_monto(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor a 0')
        return round(v, 2)


class PagoFacturaResponse(BaseModel):
    """Schema de respuesta de pago"""
    id: int
    metodo_pago_id: int
    metodo_pago_nombre: str
    monto: Decimal
    referencia_pago: Optional[str] = None
    fecha_pago: datetime
    
    model_config = {"from_attributes": True}


# ============================================
# SCHEMAS DE DETALLE FACTURA
# ============================================

class DetalleFacturaCreate(BaseModel):
    """Schema para crear línea de detalle"""
    tipo: str = Field(pattern="^(servicio|producto)$")
    item_id: int = Field(gt=0, description="ID del servicio o producto")
    cantidad: Decimal = Field(gt=0, default=1)
    precio_unitario: Decimal = Field(ge=0)
    descuento_linea: Decimal = Field(ge=0, default=0)
    especialista_id: Optional[int] = Field(None, description="ID del especialista que realizó el servicio/venta")
    cita_id: Optional[int] = None
    
    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v):
        if v not in ['servicio', 'producto']:
            raise ValueError("El tipo debe ser 'servicio' o 'producto'")
        return v


class DetalleFacturaResponse(BaseModel):
    """Schema de respuesta de detalle"""
    id: int
    tipo: str
    item_id: int
    item_nombre: str
    cantidad: Decimal
    precio_unitario: Decimal
    descuento_linea: Decimal
    subtotal: Decimal
    especialista_id: Optional[int] = None
    especialista_nombre: Optional[str] = None
    cita_id: Optional[int] = None
    comision_calculada: Optional[Decimal] = None
    
    model_config = {"from_attributes": True}


# ============================================
# SCHEMAS DE FACTURA
# ============================================

class AbonoAplicarFactura(BaseModel):
    """Schema para aplicar un abono a la factura"""
    abono_id: int = Field(gt=0, description="ID del abono a redimir")
    monto: Decimal = Field(gt=0, description="Monto a aplicar del abono")


class FacturaCreate(BaseModel):
    """Schema para crear factura"""
    cliente_id: Optional[int] = Field(None, description="ID del cliente (opcional para venta rápida)")
    detalle: List[DetalleFacturaCreate] = Field(min_length=1, description="Líneas de la factura")
    pagos: List[PagoFacturaCreate] = Field(default=[], description="Pagos aplicados")
    abonos_aplicar: List[AbonoAplicarFactura] = Field(default=[], description="Abonos del cliente a redimir")
    descuento: Decimal = Field(ge=0, default=0, description="Descuento general de la factura")
    aplicar_impuestos: bool = Field(default=True, description="Indica si se deben calcular impuestos (IVA)")
    notas: Optional[str] = None
    facturas_pendientes_ids: Optional[List[int]] = None
    factura_id_remplazar: Optional[int] = None
    
    @field_validator('detalle')
    @classmethod
    def validar_detalle(cls, v):
        if not v:
            raise ValueError('La factura debe tener al menos un ítem')
        return v
    
    @field_validator('pagos')
    @classmethod
    def validar_pagos(cls, v, info):
        # Los pagos pueden estar vacíos si se paga todo con abonos
        return v

class FacturaOrdenCreate(BaseModel):
    """Schema para crear orden de servicio (factura pendiente) por especialistas"""
    cliente_id: Optional[int] = Field(None, description="ID del cliente")
    detalle: List[DetalleFacturaCreate] = Field(min_length=1, description="Servicios y productos")
    notas: Optional[str] = None
    facturas_pendientes_ids: Optional[List[int]] = Field(None, description="IDs de servicios que están siendo consolidados/reemplazados")
    factura_id_remplazar: Optional[int] = Field(None, description="ID de la factura previa que se está editando/reemplazando")
    
    @field_validator('detalle')
    @classmethod
    def validar_detalle(cls, v):
        if not v:
            raise ValueError('La orden debe tener al menos un ítem')
        return v

class FacturaFromPendientesCreate(BaseModel):
    """Schema para facturar desde servicios pendientes"""
    cliente_id: int = Field(gt=0)
    facturas_pendientes_ids: List[int] = Field(min_length=1, description="IDs de servicios pendientes a facturar")
    detalle_adicional: List[DetalleFacturaCreate] = Field(default=[], description="Ítems adicionales a agregar")
    pagos: List[PagoFacturaCreate] = Field(min_length=1)
    descuento: Decimal = Field(ge=0, default=0)
    notas: Optional[str] = None


class AbonoAplicadoResponse(BaseModel):
    """Schema de respuesta de abono aplicado a factura"""
    id: int
    abono_id: int
    monto_aplicado: Decimal
    fecha_aplicacion: datetime


class FacturaResponse(BaseModel):
    """Schema de respuesta de factura"""
    id: int
    numero_factura: str
    cliente_id: Optional[int] = None
    cliente_nombre: Optional[str] = None
    fecha: datetime
    subtotal: Decimal
    descuento: Decimal
    impuestos: Decimal
    total: Decimal
    estado: str
    detalle: List[DetalleFacturaResponse]
    pagos: List[PagoFacturaResponse]
    abonos_aplicados: List[AbonoAplicadoResponse] = []
    total_pagado: Decimal
    total_abonos_aplicados: Decimal = Decimal(0)
    saldo_pendiente: Decimal
    caja_id: Optional[int] = None
    usuario_id: int
    notas: Optional[str] = None
    
    model_config = {"from_attributes": True}


class FacturaList(BaseModel):
    """Schema para listado de facturas"""
    id: int
    numero_factura: str
    cliente_nombre: Optional[str] = None
    fecha: datetime
    total: Decimal
    estado: str
    total_pagado: Decimal
    
    model_config = {"from_attributes": True}


class FacturaAnular(BaseModel):
    """Schema para anular factura"""
    motivo: str = Field(min_length=10, max_length=500, description="Motivo de anulación")


class DetalleFacturaUpdate(BaseModel):
    """Schema para actualizar línea de detalle o crear nueva"""
    id: Optional[int] = Field(None, description="ID del detalle a modificar. Si null, crea nuevo.")
    cantidad: Optional[Decimal] = Field(None, gt=0)
    precio_unitario: Optional[Decimal] = Field(None, ge=0)
    descuento_linea: Optional[Decimal] = Field(None, ge=0)
    especialista_id: Optional[int] = None
    
    # Campos para creación
    tipo: Optional[str] = None
    item_id: Optional[int] = None
    item_nombre: Optional[str] = None


class PagoFacturaUpdate(BaseModel):
    id: Optional[int] = None # Si tiene ID, actualiza. Si no, crea (difícil implementar crear, mejor solo actualizar por ahora)
    metodo_pago_id: int
    monto: Decimal = Field(gt=0)
    referencia_pago: Optional[str] = None

class AbonoFacturaUpdate(BaseModel):
    id: Optional[int] = None # ID de la relación RedencionAbono
    abono_id: int
    monto_aplicado: Decimal = Field(gt=0)

class FacturaUpdate(BaseModel):
    """Schema para actualizar factura (solo admin)"""
    detalle: Optional[List[DetalleFacturaUpdate]] = None
    pagos: Optional[List[PagoFacturaUpdate]] = None
    abonos: Optional[List[AbonoFacturaUpdate]] = None
    notas: Optional[str] = None
    aplicar_impuestos: Optional[bool] = None


# ============================================
# SCHEMAS DE MOVIMIENTO CAJA
# ============================================

class MovimientoCajaCreate(BaseModel):
    """Schema para crear movimiento de caja"""
    tipo: str = Field(pattern="^(ingreso|egreso)$")
    monto: Decimal = Field(gt=0)
    concepto: str = Field(min_length=3, max_length=255)
    
    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v):
        if v not in ['ingreso', 'egreso']:
            raise ValueError("El tipo debe ser 'ingreso' o 'egreso'")
        return v
    
    @field_validator('monto')
    @classmethod
    def validar_monto(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor a 0')
        return round(v, 2)


class MovimientoCajaResponse(BaseModel):
    """Schema de respuesta de movimiento"""
    id: int
    caja_id: int
    tipo: str
    monto: Decimal
    concepto: str
    factura_id: Optional[int] = None
    usuario_id: int
    usuario_nombre: str
    fecha: datetime
    
    model_config = {"from_attributes": True}


# ============================================
# SCHEMAS DE FACTURA PENDIENTE
# ============================================

class FacturaPendienteCreate(BaseModel):
    """Schema para crear servicio pendiente (desde app móvil)"""
    cliente_id: Optional[int] = None
    servicio_id: int = Field(gt=0)
    fecha_servicio: date
    notas: Optional[str] = None


class FacturaPendienteResponse(BaseModel):
    """Schema de respuesta de factura pendiente"""
    id: int
    especialista_id: int
    especialista_nombre: str
    cliente_id: Optional[int] = None
    cliente_nombre: Optional[str] = None
    servicio_id: int
    servicio_nombre: str
    servicio_precio: Decimal
    fecha_servicio: date
    notas: Optional[str] = None
    estado: str
    fecha_creacion: datetime
    
    model_config = {"from_attributes": True}


class FacturaPendienteRechazar(BaseModel):
    """Schema para rechazar servicio pendiente"""
    motivo_rechazo: str = Field(min_length=10, max_length=500)


class FacturaPendienteResumen(BaseModel):
    """Schema para resumen de pendientes por cliente"""
    cliente_id: int
    cliente_nombre: str
    total_servicios: int
    total_monto: Decimal
    servicios: List[FacturaPendienteResponse]


# ============================================
# SCHEMAS DE MÉTODO DE PAGO
# ============================================

class MetodoPagoResponse(BaseModel):
    """Schema de respuesta de método de pago"""
    id: int
    nombre: str
    activo: bool
    requiere_referencia: bool
    
    model_config = {"from_attributes": True}


class MetodoPagoUpdate(BaseModel):
    """Schema para actualizar método de pago"""
    activo: Optional[bool] = None


# ============================================
# SCHEMAS DE VENTAS Y REPORTES
# ============================================

class VentasDiaResponse(BaseModel):
    """Schema para ventas del día"""
    fecha: date
    total_facturas: int
    total_ventas: Decimal
    total_servicios: Decimal
    total_productos: Decimal
    total_efectivo: Decimal
    total_tarjeta: Decimal
    total_otros_metodos: Decimal


class VentasPorMetodoPago(BaseModel):
    """Schema para ventas por método de pago"""
    metodo_pago_id: int
    metodo_pago_nombre: str
    total_transacciones: int
    monto_total: Decimal


class VentasResumenResponse(BaseModel):
    """Schema para resumen de ventas por período"""
    fecha_inicio: date
    fecha_fin: date
    total_facturas: int
    total_ventas: Decimal
    promedio_ticket: Decimal
    metodos_pago: List[VentasPorMetodoPago]


# ============================================
# SCHEMAS DE PAGINACIÓN
# ============================================

class FacturasPaginadas(BaseModel):
    """Schema para listado paginado de facturas"""
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int
    items: List[FacturaList]


class CajasPaginadas(BaseModel):
    """Schema para listado paginado de cajas"""
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int
    items: List[CajaList]
