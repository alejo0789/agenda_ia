"""
Schemas Pydantic para el módulo de Abonos

Incluye schemas para:
- Creación de abonos
- Respuestas de abonos
- Redención de abonos en facturas
- Resumen de saldo por cliente
"""
from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
from datetime import datetime
from typing import Optional, List


# ============================================
# SCHEMAS DE ABONO
# ============================================

class AbonoCreate(BaseModel):
    """Schema para crear un abono"""
    cliente_id: int = Field(gt=0, description="ID del cliente")
    monto: Decimal = Field(gt=0, description="Monto del abono")
    metodo_pago_id: int = Field(gt=0, description="ID del método de pago")
    referencia_pago: Optional[str] = Field(None, max_length=100)
    cita_id: Optional[int] = Field(None, description="ID de la cita asociada (opcional)")
    concepto: Optional[str] = Field(None, description="Concepto/notas del abono")
    
    @field_validator('monto')
    @classmethod
    def validar_monto(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor a 0')
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "cliente_id": 1,
                "monto": 50000.00,
                "metodo_pago_id": 1,
                "cita_id": 15,
                "concepto": "Abono para cita del 25/12/2024"
            }
        }
    }


class AbonoResponse(BaseModel):
    """Schema de respuesta de abono"""
    id: int
    cliente_id: int
    cliente_nombre: str
    monto: Decimal
    saldo_disponible: Decimal
    cita_id: Optional[int] = None
    metodo_pago_id: int
    metodo_pago_nombre: str
    referencia_pago: Optional[str] = None
    estado: str
    concepto: Optional[str] = None
    fecha_creacion: datetime
    
    model_config = {"from_attributes": True}


class AbonoListItem(BaseModel):
    """Schema simplificado para listado de abonos"""
    id: int
    cliente_id: int
    cliente_nombre: str
    monto: Decimal
    saldo_disponible: Decimal
    estado: str
    cita_id: Optional[int] = None
    concepto: Optional[str] = None
    fecha_creacion: datetime
    
    model_config = {"from_attributes": True}


class AbonoClienteResumen(BaseModel):
    """Resumen de abonos de un cliente"""
    cliente_id: int
    cliente_nombre: str
    total_abonos: Decimal
    saldo_disponible: Decimal
    cantidad_abonos: int
    abonos: List[AbonoListItem]


# ============================================
# SCHEMAS DE REDENCIÓN
# ============================================

class RedencionAbonoCreate(BaseModel):
    """Schema para redimir un abono en una factura"""
    abono_id: int = Field(gt=0, description="ID del abono a redimir")
    monto_aplicar: Decimal = Field(gt=0, description="Monto a aplicar del abono")
    
    @field_validator('monto_aplicar')
    @classmethod
    def validar_monto(cls, v):
        if v <= 0:
            raise ValueError('El monto a aplicar debe ser mayor a 0')
        return v


class RedencionAbonoResponse(BaseModel):
    """Schema de respuesta de redención"""
    id: int
    abono_id: int
    factura_id: int
    monto_aplicado: Decimal
    fecha_aplicacion: datetime
    
    model_config = {"from_attributes": True}


# ============================================
# SCHEMAS PARA INTEGRACIÓN CON FACTURACIÓN
# ============================================

class AbonoParaFactura(BaseModel):
    """Abono disponible para aplicar en factura"""
    id: int
    monto_original: Decimal
    saldo_disponible: Decimal
    concepto: Optional[str] = None
    fecha_creacion: datetime
    cita_id: Optional[int] = None


class AbonosClienteFactura(BaseModel):
    """Abonos disponibles de un cliente para facturación"""
    cliente_id: int
    cliente_nombre: str
    saldo_total_disponible: Decimal
    abonos: List[AbonoParaFactura]


class AplicarAbonoFactura(BaseModel):
    """Schema para aplicar abonos al crear factura"""
    abono_id: int = Field(gt=0)
    monto: Decimal = Field(gt=0)


# ============================================
# SCHEMAS PARA ANULACIÓN
# ============================================

class AbonoAnular(BaseModel):
    """Schema para anular un abono"""
    motivo: str = Field(min_length=5, max_length=500, description="Motivo de anulación")
