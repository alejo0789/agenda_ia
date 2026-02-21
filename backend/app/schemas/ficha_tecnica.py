from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from pydantic.json_schema import SkipJsonSchema

# ============================================
# SCHEMAS CAMPOS
# ============================================

class CampoFichaBase(BaseModel):
    nombre: str
    tipo: str = Field(..., description="texto_corto, texto_largo, numero, opcion_multiple, casillas, fecha, informativo")
    opciones: Optional[str] = Field(None, description="Opciones separadas por coma si aplica")
    requerido: bool = False
    orden: int = 0

class CampoFichaCreate(CampoFichaBase):
    pass

class CampoFichaUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    opciones: Optional[str] = None
    requerido: Optional[bool] = None
    orden: Optional[int] = None

class CampoFichaResponse(CampoFichaBase):
    id: int
    plantilla_id: int
    
    class Config:
        from_attributes = True

# ============================================
# SCHEMAS PLANTILLAS
# ============================================

class PlantillaFichaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activa: bool = True
    sede_id: Optional[int] = None

class PlantillaFichaCreate(PlantillaFichaBase):
    campos: List[CampoFichaCreate] = []

class PlantillaFichaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activa: Optional[bool] = None
    sede_id: Optional[int] = None

class PlantillaFichaResponse(PlantillaFichaBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    campos: List[CampoFichaResponse] = []
    
    class Config:
        from_attributes = True

# ============================================
# SCHEMAS RESPUESTAS
# ============================================

class RespuestaFichaCreate(BaseModel):
    campo_id: int
    valor: Optional[str] = None

class RespuestaFichaResponse(BaseModel):
    id: int
    cita_ficha_id: int
    campo_id: int
    valor: Optional[str] = None
    
    class Config:
        from_attributes = True

# ============================================
# SCHEMAS CITA - FICHA (Vinculación)
# ============================================

class CitaFichaCreate(BaseModel):
    plantilla_id: int
    cita_id: int

class CitaFichaResponse(BaseModel):
    id: int
    cita_id: int
    plantilla_id: int
    estado: str
    token_publico: str
    fecha_envio: Optional[datetime] = None
    fecha_diligenciamiento: Optional[datetime] = None
    fecha_creacion: datetime
    
    # Para visualizar en el front
    plantilla_nombre: Optional[str] = None
    
    respuestas: List[RespuestaFichaResponse] = []
    
    class Config:
        from_attributes = True

# ============================================
# SCHEMAS PARA FORMULARIO PUBLICO
# ============================================

class FormularioPublicoSubmit(BaseModel):
    respuestas: List[RespuestaFichaCreate]
