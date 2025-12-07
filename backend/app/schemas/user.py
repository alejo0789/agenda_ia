from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class RolBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class RolResponse(RolBase):
    id: int
    es_sistema: bool
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: EmailStr
    nombre: str
    rol_id: int
    estado: Optional[str] = "activo"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    estado: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    fecha_creacion: datetime
    rol: RolResponse  # Agregado para incluir el objeto rol completo
    
    class Config:
        from_attributes = True
