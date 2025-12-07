from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import re


# ============================================
# SCHEMAS DE CATEGORIA DE SERVICIO
# ============================================

class CategoriaServicioBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None
    orden_visualizacion: Optional[int] = Field(0, ge=0)


class CategoriaServicioCreate(CategoriaServicioBase):
    pass


class CategoriaServicioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = None
    orden_visualizacion: Optional[int] = Field(None, ge=0)


class CategoriaServicioResponse(CategoriaServicioBase):
    id: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class CategoriaOrdenItem(BaseModel):
    id: int
    orden_visualizacion: int


class CategoriaOrdenUpdate(BaseModel):
    """Schema para reordenar categorías"""
    categorias: List[CategoriaOrdenItem]


# ============================================
# SCHEMAS DE SERVICIO
# ============================================

class ServicioBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None
    duracion_minutos: int = Field(..., ge=15, description="Duración mínima 15 minutos")
    precio_base: Decimal = Field(..., ge=0, decimal_places=2)
    categoria_id: Optional[int] = None
    requiere_producto: Optional[bool] = False
    estado: Optional[str] = Field("activo", pattern="^(activo|inactivo)$")
    color_calendario: Optional[str] = Field("#3498db", description="Color HEX para el calendario")
    tipo_comision: Optional[str] = Field("porcentaje", pattern="^(porcentaje|fijo)$", description="Tipo de comisión: porcentaje o fijo")
    valor_comision: Optional[Decimal] = Field(40, ge=0, decimal_places=2, description="Valor de la comisión")

    @field_validator('duracion_minutos')
    @classmethod
    def validar_duracion_multiplo(cls, v):
        """RN-SER-002: Duración debe ser múltiplo de 15"""
        if v % 15 != 0:
            raise ValueError('La duración debe ser múltiplo de 15 minutos')
        return v

    @field_validator('color_calendario')
    @classmethod
    def validar_color_hex(cls, v):
        """RN-SER-004: Color HEX válido (#RRGGBB)"""
        if v is None:
            return "#3498db"
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('El color debe ser un código HEX válido (#RRGGBB)')
        return v


class ServicioCreate(ServicioBase):
    pass


class ServicioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = None
    duracion_minutos: Optional[int] = Field(None, ge=15)
    precio_base: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    categoria_id: Optional[int] = None
    requiere_producto: Optional[bool] = None
    estado: Optional[str] = Field(None, pattern="^(activo|inactivo)$")
    color_calendario: Optional[str] = None
    tipo_comision: Optional[str] = Field(None, pattern="^(porcentaje|fijo)$")
    valor_comision: Optional[Decimal] = Field(None, ge=0, decimal_places=2)

    @field_validator('duracion_minutos')
    @classmethod
    def validar_duracion_multiplo(cls, v):
        if v is not None and v % 15 != 0:
            raise ValueError('La duración debe ser múltiplo de 15 minutos')
        return v

    @field_validator('color_calendario')
    @classmethod
    def validar_color_hex(cls, v):
        if v is not None and not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('El color debe ser un código HEX válido (#RRGGBB)')
        return v


class ServicioResponse(ServicioBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True


class ServicioConCategoriaResponse(ServicioResponse):
    """Servicio con información de categoría incluida"""
    categoria: Optional[CategoriaServicioResponse] = None


# ============================================
# SCHEMAS DE SERVICIOS ACTIVOS POR CATEGORÍA
# ============================================

class ServicioPorCategoriaResponse(BaseModel):
    """Estructura de servicios agrupados por categoría"""
    categoria_id: Optional[int]
    categoria_nombre: Optional[str]
    servicios: List[ServicioResponse]
