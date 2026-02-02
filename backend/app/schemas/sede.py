from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class SedeBase(BaseModel):
    codigo: str
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    estado: str = "activa"
    es_principal: bool = False

class SedeCreate(SedeBase):
    pass

class SedeUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    estado: Optional[str] = None
    es_principal: Optional[bool] = None

class SedeResponse(SedeBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    
    class Config:
        from_attributes = True

class SedeList(SedeResponse):
    pass
