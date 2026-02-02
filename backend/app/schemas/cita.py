from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, time, datetime
import re


# ============================================
# SCHEMAS BASE
# ============================================

class CitaBase(BaseModel):
    cliente_id: int = Field(..., description="ID del cliente")
    especialista_id: int = Field(..., description="ID del especialista")
    servicio_id: int = Field(..., description="ID del servicio")
    fecha: date = Field(..., description="Fecha de la cita")
    hora_inicio: time = Field(..., description="Hora de inicio")
    notas: Optional[str] = Field(None, description="Notas de la cita")


# ============================================
# SCHEMAS PARA CREAR
# ============================================

class CitaCreate(CitaBase):
    """Schema para crear una nueva cita"""
    
    # Campo opcional para registrar un abono inicial
    monto_abono: Optional[float] = Field(None, description="Monto del abono inicial (opcional)")
    metodo_pago_id: Optional[int] = Field(None, description="ID del método de pago para el abono")
    referencia_pago: Optional[str] = Field(None, description="Referencia/Comprobante del pago del abono")
    concepto_abono: Optional[str] = Field(None, description="Concepto del abono (opcional)")


# ============================================
# SCHEMAS PARA ACTUALIZAR
# ============================================

class CitaUpdate(BaseModel):
    """Schema para actualizar una cita - Todos los campos opcionales"""
    cliente_id: Optional[int] = None
    especialista_id: Optional[int] = None
    servicio_id: Optional[int] = None
    fecha: Optional[date] = None
    hora_inicio: Optional[time] = None
    notas: Optional[str] = None
    notas_internas: Optional[str] = None
    estado: Optional[str] = Field(None, pattern='^(agendada|confirmada|cliente_llego|completada|cancelada|no_show)$')


class CitaCambiarEstado(BaseModel):
    """Schema para cambiar el estado de una cita"""
    estado: str = Field(..., pattern='^(agendada|confirmada|cliente_llego|completada|cancelada|no_show)$')
    notas_internas: Optional[str] = None


# ============================================
# SCHEMAS DE RESPUESTA
# ============================================

class ClienteSimple(BaseModel):
    id: int
    nombre: str
    apellido: Optional[str]
    telefono: Optional[str]
    
    class Config:
        from_attributes = True


class EspecialistaSimple(BaseModel):
    id: int
    nombre: str
    apellido: Optional[str]
    color: Optional[str]
    
    class Config:
        from_attributes = True


class ServicioSimple(BaseModel):
    id: int
    nombre: str
    duracion_minutos: int
    precio_base: int
    color_calendario: Optional[str]
    
    class Config:
        from_attributes = True


class CitaResponse(BaseModel):
    """Schema de respuesta completo de cita"""
    id: int
    cliente_id: int
    especialista_id: int
    servicio_id: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    duracion_minutos: int
    estado: str
    notas: Optional[str]
    notas_internas: Optional[str]
    precio: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    
    # Relaciones expandidas
    cliente: Optional[ClienteSimple] = None
    especialista: Optional[EspecialistaSimple] = None
    servicio: Optional[ServicioSimple] = None
    
    class Config:
        from_attributes = True


class CitaListResponse(BaseModel):
    """Schema para listados de citas (calendario)"""
    id: int
    cliente_id: int
    especialista_id: int
    servicio_id: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    duracion_minutos: int
    estado: str
    notas: Optional[str]
    
    # Info básica de relaciones
    cliente_nombre: str
    cliente_telefono: Optional[str]
    especialista_nombre: str
    servicio_nombre: str
    servicio_color: Optional[str]
    
    class Config:
        from_attributes = True


# ============================================
# SCHEMAS PARA FILTROS
# ============================================

class CitaFilters(BaseModel):
    """Filtros para listar citas"""
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    especialista_id: Optional[int] = None
    cliente_id: Optional[int] = None
    estado: Optional[str] = None
