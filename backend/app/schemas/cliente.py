from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
import re


# ============================================
# SCHEMAS DE ETIQUETA (para incluir en cliente)
# ============================================

class EtiquetaSimple(BaseModel):
    """Etiqueta simplificada para incluir en respuestas de cliente"""
    id: int
    nombre: str
    color: str
    
    class Config:
        from_attributes = True


class ClienteEtiquetaBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=50, description="Nombre de la etiqueta")
    color: str = Field(default='#6c757d', description="Color en formato HEX")
    
    @field_validator('color')
    @classmethod
    def validar_color_hex(cls, v):
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('El color debe estar en formato HEX (#RRGGBB)')
        return v.upper()


class ClienteEtiquetaCreate(ClienteEtiquetaBase):
    pass


class ClienteEtiquetaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=50)
    color: Optional[str] = None
    
    @field_validator('color')
    @classmethod
    def validar_color_hex(cls, v):
        if v is None:
            return v
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('El color debe estar en formato HEX (#RRGGBB)')
        return v.upper()


class ClienteEtiquetaResponse(ClienteEtiquetaBase):
    id: int
    total_clientes: int = 0  # Calculado en el servicio
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True


# ============================================
# SCHEMAS BASE DE CLIENTE
# ============================================

class ClienteBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre del cliente")
    apellido: Optional[str] = Field(None, max_length=100, description="Apellido del cliente")
    cedula: Optional[str] = Field(None, max_length=20, description="Cédula/Documento de identidad")
    telefono: Optional[str] = Field(None, max_length=20, description="Teléfono del cliente")
    email: Optional[EmailStr] = Field(None, description="Email del cliente")
    fecha_nacimiento: Optional[date] = Field(None, description="Fecha de nacimiento")
    direccion: Optional[str] = Field(None, description="Dirección")
    notas: Optional[str] = Field(None, description="Notas adicionales")
    
    @field_validator('cedula')
    @classmethod
    def validar_cedula(cls, v):
        if v is None:
            return v
        # Remover espacios y guiones
        cedula_limpia = re.sub(r'[\s\-]', '', v)
        # Validar que solo contenga números y tenga longitud adecuada (6-15 dígitos)
        if not re.match(r'^\d{6,15}$', cedula_limpia):
            raise ValueError('Formato de cédula inválido. Debe contener entre 6 y 15 dígitos.')
        return cedula_limpia
    
    @field_validator('telefono')
    @classmethod
    def validar_telefono(cls, v):
        if v is None:
            return v
        # Remover espacios, guiones y paréntesis
        telefono_limpio = re.sub(r'[\s\-\(\)]', '', v)
        # Validar que solo contenga números y tenga longitud adecuada
        if not re.match(r'^\+?\d{7,15}$', telefono_limpio):
            raise ValueError('Formato de teléfono inválido. Debe contener entre 7 y 15 dígitos.')
        return telefono_limpio
    
    @field_validator('fecha_nacimiento')
    @classmethod
    def validar_fecha_nacimiento(cls, v):
        if v is None:
            return v
        if v > date.today():
            raise ValueError('La fecha de nacimiento no puede ser futura')
        # Validar edad mínima (ej: 10 años)
        edad = (date.today() - v).days // 365
        if edad < 10:
            raise ValueError('El cliente debe tener al menos 10 años')
        return v


# ============================================
# SCHEMAS PARA CREAR
# ============================================

class ClienteCreate(ClienteBase):
    """Schema para crear un nuevo cliente"""
    pass


# ============================================
# SCHEMAS PARA ACTUALIZAR
# ============================================

class ClienteUpdate(BaseModel):
    """Schema para actualizar un cliente existente - Todos los campos opcionales"""
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    cedula: Optional[str] = Field(None, max_length=20)
    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    fecha_nacimiento: Optional[date] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None
    estado: Optional[str] = Field(None, pattern='^(activo|inactivo)$')
    
    @field_validator('cedula')
    @classmethod
    def validar_cedula(cls, v):
        if v is None:
            return v
        cedula_limpia = re.sub(r'[\s\-]', '', v)
        if not re.match(r'^\d{6,15}$', cedula_limpia):
            raise ValueError('Formato de cédula inválido')
        return cedula_limpia
    
    @field_validator('telefono')
    @classmethod
    def validar_telefono(cls, v):
        if v is None:
            return v
        telefono_limpio = re.sub(r'[\s\-\(\)]', '', v)
        if not re.match(r'^\+?\d{7,15}$', telefono_limpio):
            raise ValueError('Formato de teléfono inválido')
        return telefono_limpio


# ============================================
# SCHEMAS DE RESPUESTA
# ============================================

class ClienteResponse(ClienteBase):
    """Schema de respuesta completo de cliente"""
    id: int
    estado: str
    total_visitas: int
    fecha_primera_visita: Optional[date]
    ultima_visita: Optional[date]
    etiquetas: List[EtiquetaSimple] = []
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm_with_etiquetas(cls, cliente, etiquetas: List[EtiquetaSimple] = None):
        """Crear respuesta con etiquetas cargadas"""
        data = {
            "id": cliente.id,
            "nombre": cliente.nombre,
            "apellido": cliente.apellido,
            "telefono": cliente.telefono,
            "email": cliente.email,
            "fecha_nacimiento": cliente.fecha_nacimiento,
            "direccion": cliente.direccion,
            "notas": cliente.notas,
            "estado": cliente.estado,
            "total_visitas": cliente.total_visitas or 0,
            "fecha_primera_visita": cliente.fecha_primera_visita,
            "ultima_visita": cliente.ultima_visita,
            "etiquetas": etiquetas or [],
            "fecha_creacion": cliente.fecha_creacion,
            "fecha_actualizacion": cliente.fecha_actualizacion,
        }
        return cls(**data)


class ClienteListResponse(BaseModel):
    """Schema de respuesta para listados (menos campos)"""
    id: int
    nombre: str
    apellido: Optional[str]
    cedula: Optional[str]
    telefono: Optional[str]
    email: Optional[str]
    total_visitas: int
    ultima_visita: Optional[date]
    etiquetas: List[EtiquetaSimple] = []
    estado: str
    
    class Config:
        from_attributes = True


# ============================================
# SCHEMAS PAGINADOS
# ============================================

class ClientePaginado(BaseModel):
    """Respuesta paginada de clientes"""
    total: int
    pagina: int
    por_pagina: int
    total_paginas: int
    items: List[ClienteListResponse]


# ============================================
# SCHEMAS DE PREFERENCIAS
# ============================================

class ClientePreferenciaBase(BaseModel):
    productos_favoritos: Optional[List[int]] = Field(default_factory=list, description="IDs de productos favoritos")
    alergias: Optional[str] = None
    notas_servicio: Optional[str] = None


class ClientePreferenciaCreate(ClientePreferenciaBase):
    cliente_id: int


class ClientePreferenciaUpdate(BaseModel):
    """Todos los campos opcionales para actualización"""
    productos_favoritos: Optional[List[int]] = None
    alergias: Optional[str] = None
    notas_servicio: Optional[str] = None


class ClientePreferenciaResponse(ClientePreferenciaBase):
    id: int
    cliente_id: int
    fecha_actualizacion: datetime
    
    class Config:
        from_attributes = True


# ============================================
# SCHEMAS DE ASIGNACIÓN DE ETIQUETAS
# ============================================

class AsignarEtiquetasRequest(BaseModel):
    """Request para asignar etiquetas a un cliente"""
    etiqueta_ids: List[int] = Field(..., description="Lista de IDs de etiquetas a asignar")
