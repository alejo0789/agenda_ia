from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Importar SedeResponse para usarlo en UserResponse - mejor definir un SedeBasic para evitar ciclos si fuera necesario
# Pero como Sede no importa User, está bien.
from .sede import SedeResponse
# Importar PermisoResponse para RolResponse (usando forward reference o import condicional si fuera necesario, pero auth.py no depende de user.py aparentemente)
from .auth import PermisoResponse

class RolBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class RolResponse(RolBase):
    id: int
    es_sistema: bool
    sede_id: Optional[int] = None
    permisos: List[PermisoResponse] = []
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: EmailStr
    nombre: str
    rol_id: int
    sede_id: Optional[int] = None
    estado: Optional[str] = "activo"
    # Campos nuevos
    primer_acceso: Optional[bool] = True
    requiere_cambio_password: Optional[bool] = False

class UserCreate(UserBase):
    password: str
    especialista_id: Optional[int] = None

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    estado: Optional[str] = None
    password: Optional[str] = None
    rol_id: Optional[int] = None
    sede_id: Optional[int] = None
    especialista_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    fecha_creacion: datetime
    rol: RolResponse
    sede: Optional[SedeResponse] = None # Sede puede ser opcional
    especialista_id: Optional[int] = None
    
    class Config:
        from_attributes = True

