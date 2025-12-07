from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class PermisoBase(BaseModel):
    codigo: str
    nombre: str
    modulo: str
    descripcion: Optional[str] = None

class PermisoResponse(PermisoBase):
    id: int
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class RolPermisoResponse(BaseModel):
    rol_id: int
    permiso_id: int
    permiso: Optional[PermisoResponse] = None
    
    class Config:
        from_attributes = True

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
