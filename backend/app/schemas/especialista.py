from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import date, datetime, time
from decimal import Decimal


# ============================================
# SCHEMAS DE ESPECIALISTA
# ============================================

class EspecialistaBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    apellido: str = Field(..., min_length=1, max_length=100)
    documento_identidad: Optional[str] = Field(None, max_length=20)
    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    foto: Optional[str] = None
    estado: Optional[str] = Field("activo", pattern="^(activo|inactivo)$")
    fecha_ingreso: Optional[date] = None


class EspecialistaCreate(EspecialistaBase):
    crear_usuario: Optional[bool] = True


class EspecialistaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    apellido: Optional[str] = Field(None, min_length=1, max_length=100)
    documento_identidad: Optional[str] = Field(None, max_length=20)
    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    foto: Optional[str] = None
    estado: Optional[str] = Field(None, pattern="^(activo|inactivo)$")
    fecha_ingreso: Optional[date] = None


class EspecialistaResponse(EspecialistaBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True


# ============================================
# SCHEMAS DE HORARIO
# ============================================

class HorarioEspecialistaBase(BaseModel):
    dia_semana: int = Field(..., ge=0, le=6, description="0=Domingo, 6=Sábado")
    hora_inicio: time
    hora_fin: time
    activo: Optional[bool] = True

    @field_validator('hora_fin')
    @classmethod
    def validar_hora_fin(cls, v, info):
        if 'hora_inicio' in info.data and v <= info.data['hora_inicio']:
            raise ValueError('hora_fin debe ser mayor que hora_inicio')
        return v


class HorarioEspecialistaCreate(HorarioEspecialistaBase):
    pass


class HorarioEspecialistaUpdate(BaseModel):
    dia_semana: Optional[int] = Field(None, ge=0, le=6)
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    activo: Optional[bool] = None


class HorarioEspecialistaResponse(HorarioEspecialistaBase):
    id: int
    especialista_id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class HorariosBatchCreate(BaseModel):
    horarios: List[HorarioEspecialistaCreate]


# ============================================
# SCHEMAS DE BLOQUEO
# ============================================

class BloqueoEspecialistaBase(BaseModel):
    fecha_inicio: date
    fecha_fin: date
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    motivo: Optional[str] = Field(None, max_length=255)
    es_recurrente: Optional[bool] = False
    dias_semana: Optional[List[int]] = None

    @field_validator('fecha_fin')
    @classmethod
    def validar_fecha_fin(cls, v, info):
        if 'fecha_inicio' in info.data and v < info.data['fecha_inicio']:
            raise ValueError('fecha_fin debe ser mayor o igual a fecha_inicio')
        return v

    @field_validator('dias_semana')
    @classmethod
    def validar_dias_semana(cls, v, info):
        if info.data.get('es_recurrente') and not v:
            raise ValueError('Bloqueos recurrentes requieren días de semana')
        if v:
            for dia in v:
                if dia < 0 or dia > 6:
                    raise ValueError('Los días de semana deben estar entre 0 y 6')
        return v


class BloqueoEspecialistaCreate(BloqueoEspecialistaBase):
    pass


class BloqueoEspecialistaUpdate(BaseModel):
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    motivo: Optional[str] = Field(None, max_length=255)
    es_recurrente: Optional[bool] = None
    dias_semana: Optional[List[int]] = None


class BloqueoEspecialistaResponse(BloqueoEspecialistaBase):
    id: int
    especialista_id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True


# ============================================
# SCHEMAS DE SERVICIO DEL ESPECIALISTA
# ============================================

class EspecialistaServicioBase(BaseModel):
    servicio_id: int
    tipo_comision: str = Field(..., pattern="^(porcentaje|fijo)$")
    valor_comision: Decimal = Field(..., ge=0, decimal_places=2)

    @field_validator('valor_comision')
    @classmethod
    def validar_comision_porcentaje(cls, v, info):
        if info.data.get('tipo_comision') == 'porcentaje' and v > 100:
            raise ValueError('El porcentaje de comisión no puede ser mayor a 100')
        return v


class EspecialistaServicioCreate(EspecialistaServicioBase):
    pass


class EspecialistaServicioUpdate(BaseModel):
    tipo_comision: Optional[str] = Field(None, pattern="^(porcentaje|fijo)$")
    valor_comision: Optional[Decimal] = Field(None, ge=0, decimal_places=2)


class EspecialistaServicioResponse(EspecialistaServicioBase):
    especialista_id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True


# ============================================
# SCHEMAS DE DISPONIBILIDAD
# ============================================

class SlotDisponible(BaseModel):
    fecha: date
    hora_inicio: time
    hora_fin: time
    disponible: bool


class DisponibilidadRequest(BaseModel):
    especialista_id: int
    servicio_id: int
    fecha_inicio: date
    fecha_fin: date


class DisponibilidadGeneralRequest(BaseModel):
    servicio_id: int
    fecha_inicio: date
    fecha_fin: date


class DisponibilidadResponse(BaseModel):
    especialista_id: int
    slots: List[SlotDisponible]
