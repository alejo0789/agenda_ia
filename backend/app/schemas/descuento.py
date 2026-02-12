from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal

class DescuentoBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    codigo: Optional[str] = Field(None, max_length=50)
    descripcion: Optional[str] = None
    tipo: str = Field(..., pattern='^(porcentaje|monto_fijo)$')
    valor: Decimal = Field(..., gt=0)
    activo: bool = Field(default=True)
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    sede_id: Optional[int] = None

    @field_validator('valor')
    @classmethod
    def validar_valor(cls, v, info):
        # We need to access 'tipo' from the values being validated
        # But in Pydantic v2 field validators run individually. 
        # We'll use model_validator for cross-field validation.
        return v

    @model_validator(mode='after')
    def validar_consistencia(self):
        if self.tipo == 'porcentaje' and self.valor > 100:
            raise ValueError('El porcentaje no puede ser mayor a 100')
        
        if self.fecha_inicio and self.fecha_fin and self.fecha_inicio > self.fecha_fin:
            raise ValueError('La fecha de inicio no puede ser posterior a la fecha de fin')
        
        return self

class DescuentoCreate(DescuentoBase):
    pass

class DescuentoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    codigo: Optional[str] = Field(None, max_length=50)
    descripcion: Optional[str] = None
    tipo: Optional[str] = Field(None, pattern='^(porcentaje|monto_fijo)$')
    valor: Optional[Decimal] = Field(None, gt=0)
    activo: Optional[bool] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    sede_id: Optional[int] = None

    @model_validator(mode='after')
    def validar_consistencia(self):
        # Only validate if both present or if type implies check
        # This is trickier in partial updates. We'll skip strict cross-check for Update 
        # unless we want to fetch DB state, which schema shouldn't do.
        # But we can check simple things if both are provided.
        if self.fecha_inicio and self.fecha_fin and self.fecha_inicio > self.fecha_fin:
            raise ValueError('La fecha de inicio no puede ser posterior a la fecha de fin')
        return self

class DescuentoResponse(DescuentoBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
