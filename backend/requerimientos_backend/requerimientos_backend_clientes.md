# Requerimientos Backend - Módulo de Gestión de Clientes
## Club de Alisados - FastAPI

---

## ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Modelos de Datos](#modelos-de-datos)
3. [Schemas de Validación](#schemas-de-validación)
4. [Endpoints de API](#endpoints-de-api)
5. [Servicios de Negocio](#servicios-de-negocio)
6. [Reglas de Negocio](#reglas-de-negocio)
7. [Validaciones](#validaciones)
8. [Jobs y Tareas Programadas](#jobs-y-tareas-programadas)
9. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
10. [Testing](#testing)
11. [Dependencias con Otros Módulos](#dependencias-con-otros-módulos)

---

## RESUMEN EJECUTIVO

### Propósito
El módulo de Gestión de Clientes es fundamental para el sistema Club de Alisados. Gestiona toda la información de los clientes del salón, incluyendo datos personales, historial de servicios, preferencias, segmentación mediante etiquetas, y estadísticas de visitas.

### Prioridad
**CRÍTICA** - Este módulo es dependencia directa de:
- Módulo de Agenda/Calendario (citas requieren cliente)
- Módulo de Punto de Venta (facturas requieren cliente)
- Módulo de CRM (comunicaciones con cliente)
- Módulo de Reportes (análisis de clientes)

### Estadísticas del Módulo

| Componente | Cantidad |
|-----------|----------|
| Modelos SQLAlchemy | 6 |
| Schemas Pydantic | 16 |
| Endpoints API | 17 |
| Servicios | 4 |
| Reglas de Negocio | 15 |
| Tests Unitarios | ~50 |
| Tests Integración | ~20 |

**Tablas de Base de Datos**:
- `clientes` - Información principal de clientes
- `cliente_preferencias` - Preferencias y notas de servicio
- `cliente_etiquetas` - Catálogo de etiquetas para segmentación
- `cliente_etiqueta_asignacion` - Asignación de etiquetas a clientes
- `cliente_historial_comunicacion` - Historial de comunicaciones (CRM)
- `cliente_fotos` - Fotos antes/después de servicios

### Stack Tecnológico

| Componente | Tecnología |
|-----------|------------|
| Framework | FastAPI 0.104+ |
| ORM | SQLAlchemy 2.0 |
| Validación | Pydantic v2 |
| Base de Datos | PostgreSQL 15+ |
| Migraciones | Alembic |

---

## MODELOS DE DATOS

### 1. Cliente (SQLAlchemy Model)

**Archivo**: `app/models/cliente.py`

**Nota**: La tabla `clientes` ya existe en la base de datos con la siguiente estructura:

```sql
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    fecha_nacimiento DATE,
    direccion TEXT,
    notas TEXT,
    fecha_primera_visita DATE,
    ultima_visita DATE,
    total_visitas INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices existentes
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_nombre ON clientes(nombre, apellido);

-- Trigger automático para fecha_actualizacion
CREATE TRIGGER tr_clientes_update BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();

-- Trigger para actualizar visitas
CREATE OR REPLACE FUNCTION actualizar_visitas_cliente()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'completada' AND OLD.estado != 'completada' THEN
        UPDATE clientes 
        SET 
            total_visitas = total_visitas + 1,
            ultima_visita = NEW.fecha
        WHERE id = NEW.cliente_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Modelo SQLAlchemy**:

```python
from sqlalchemy import Column, Integer, String, Date, Text, TIMESTAMP, func, CheckConstraint
from sqlalchemy.orm import relationship, column_property
from sqlalchemy import select
from app.database import Base

class Cliente(Base):
    __tablename__ = "clientes"
    
    # Campos principales
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    apellido = Column(String(100), index=True)
    telefono = Column(String(20), index=True)
    email = Column(String(100), index=True)
    
    # Información adicional
    fecha_nacimiento = Column(Date)
    direccion = Column(Text)
    notas = Column(Text)
    
    # Estadísticas automáticas (actualizadas por triggers)
    fecha_primera_visita = Column(Date)
    ultima_visita = Column(Date)
    total_visitas = Column(Integer, default=0)
    
    # Estado y control
    estado = Column(String(20), default='activo')
    
    # Timestamps (actualizados por triggers)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    fecha_actualizacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraint de estado
    __table_args__ = (
        CheckConstraint("estado IN ('activo', 'inactivo')", name='chk_cliente_estado'),
    )
    
    # Relaciones
    citas = relationship("Cita", back_populates="cliente")
    facturas = relationship("Factura", back_populates="cliente")
    facturas_pendientes = relationship("FacturaPendiente", back_populates="cliente")
    comunicaciones = relationship("ClienteHistorialComunicacion", back_populates="cliente")
    fotos = relationship("ClienteFoto", back_populates="cliente")
    preferencias = relationship("ClientePreferencia", back_populates="cliente", uselist=False)
    etiquetas_asignadas = relationship("ClienteEtiquetaAsignacion", back_populates="cliente")
    cupones_especificos = relationship("Cupon", back_populates="cliente_especifico")
    
    # Propiedad computada para nombre completo
    @property
    def nombre_completo(self) -> str:
        """Genera nombre completo concatenando nombre y apellido"""
        if self.apellido:
            return f"{self.nombre} {self.apellido}"
        return self.nombre
    
    def __repr__(self):
        return f"<Cliente(id={self.id}, nombre='{self.nombre_completo}', estado='{self.estado}')>"
```

### 2. ClientePreferencia (SQLAlchemy Model)

**Archivo**: `app/models/cliente_preferencia.py`

**Nota**: La tabla `cliente_preferencias` ya existe en la base de datos:

```sql
CREATE TABLE cliente_preferencias (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    productos_favoritos JSONB, -- Array de IDs de productos
    alergias TEXT,
    notas_servicio TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Modelo SQLAlchemy**:

```python
from sqlalchemy import Column, Integer, Text, ForeignKey, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base

class ClientePreferencia(Base):
    __tablename__ = "cliente_preferencias"
    
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    
    # Preferencias (JSONB para productos favoritos)
    productos_favoritos = Column(JSONB)  # Array de IDs: [1, 5, 12]
    alergias = Column(Text)
    notas_servicio = Column(Text)
    
    # Timestamp
    fecha_actualizacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relación
    cliente = relationship("Cliente", back_populates="preferencias")
    
    def __repr__(self):
        return f"<ClientePreferencia(cliente_id={self.cliente_id})>"
```

### 3. ClienteEtiqueta (SQLAlchemy Model)

**Archivo**: `app/models/cliente_etiqueta.py`

**Nota**: La tabla se llama `cliente_etiquetas` en la base de datos:

```sql
CREATE TABLE cliente_etiquetas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6c757d',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Modelo SQLAlchemy**:

```python
from sqlalchemy import Column, Integer, String, TIMESTAMP, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class ClienteEtiqueta(Base):
    __tablename__ = "cliente_etiquetas"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True, index=True)
    color = Column(String(7), default='#6c757d')  # HEX color
    
    # Timestamp
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relación (a través de tabla asociativa)
    asignaciones = relationship("ClienteEtiquetaAsignacion", back_populates="etiqueta", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ClienteEtiqueta(id={self.id}, nombre='{self.nombre}')>"
```

### 4. ClienteEtiquetaAsignacion (SQLAlchemy Model - Tabla de relación)

**Archivo**: `app/models/cliente_etiqueta_asignacion.py`

**Nota**: La tabla se llama `cliente_etiqueta_asignacion` en la base de datos:

```sql
CREATE TABLE cliente_etiqueta_asignacion (
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    etiqueta_id INTEGER NOT NULL REFERENCES cliente_etiquetas(id) ON DELETE CASCADE,
    PRIMARY KEY (cliente_id, etiqueta_id)
);
```

**Modelo SQLAlchemy**:

```python
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ClienteEtiquetaAsignacion(Base):
    __tablename__ = "cliente_etiqueta_asignacion"
    
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), primary_key=True)
    etiqueta_id = Column(Integer, ForeignKey("cliente_etiquetas.id", ondelete="CASCADE"), primary_key=True)
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="etiquetas_asignadas")
    etiqueta = relationship("ClienteEtiqueta", back_populates="asignaciones")
    
    def __repr__(self):
        return f"<ClienteEtiquetaAsignacion(cliente_id={self.cliente_id}, etiqueta_id={self.etiqueta_id})>"
```

### 5. ClienteHistorialComunicacion (SQLAlchemy Model)

**Archivo**: `app/models/cliente_historial_comunicacion.py`

**Nota**: Tabla adicional del CRM que existe en la base de datos:

```sql
CREATE TABLE cliente_historial_comunicacion (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('llamada', 'sms', 'email', 'whatsapp')),
    asunto VARCHAR(255),
    contenido TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Modelo SQLAlchemy**:

```python
from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class ClienteHistorialComunicacion(Base):
    __tablename__ = "cliente_historial_comunicacion"
    
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False, index=True)
    tipo = Column(String(20), nullable=False)
    asunto = Column(String(255))
    contenido = Column(Text)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    # Timestamp
    fecha = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraint de tipo
    __table_args__ = (
        CheckConstraint("tipo IN ('llamada', 'sms', 'email', 'whatsapp')", name='chk_comunicacion_tipo'),
    )
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="comunicaciones")
    usuario = relationship("Usuario")
    
    def __repr__(self):
        return f"<ClienteHistorialComunicacion(id={self.id}, cliente_id={self.cliente_id}, tipo='{self.tipo}')>"
```

### 6. ClienteFoto (SQLAlchemy Model)

**Archivo**: `app/models/cliente_foto.py`

**Nota**: Tabla para fotos antes/después:

```sql
CREATE TABLE cliente_fotos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    servicio_id INTEGER REFERENCES servicios(id),
    tipo VARCHAR(20) CHECK (tipo IN ('antes', 'despues')),
    ruta_foto TEXT NOT NULL,
    notas TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Modelo SQLAlchemy**:

```python
from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class ClienteFoto(Base):
    __tablename__ = "cliente_fotos"
    
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False, index=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id"))
    tipo = Column(String(20))
    ruta_foto = Column(Text, nullable=False)
    notas = Column(Text)
    
    # Timestamp
    fecha = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Constraint de tipo
    __table_args__ = (
        CheckConstraint("tipo IN ('antes', 'despues')", name='chk_foto_tipo'),
    )
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="fotos")
    servicio = relationship("Servicio")
    
    def __repr__(self):
        return f"<ClienteFoto(id={self.id}, cliente_id={self.cliente_id}, tipo='{self.tipo}')>"
```

---

## SCHEMAS DE VALIDACIÓN

### Schemas de Cliente

**Archivo**: `app/schemas/cliente.py`

```python
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
import re

# ============================================
# SCHEMAS BASE
# ============================================

class ClienteBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre del cliente")
    apellido: Optional[str] = Field(None, max_length=100, description="Apellido del cliente")
    telefono: Optional[str] = Field(None, max_length=20, description="Teléfono del cliente")
    email: Optional[EmailStr] = Field(None, description="Email del cliente")
    fecha_nacimiento: Optional[date] = Field(None, description="Fecha de nacimiento")
    direccion: Optional[str] = Field(None, description="Dirección")
    notas: Optional[str] = Field(None, description="Notas adicionales")
    
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
    # nombre es obligatorio (heredado de Base)
    pass

# ============================================
# SCHEMAS PARA ACTUALIZAR
# ============================================

class ClienteUpdate(BaseModel):
    """Schema para actualizar un cliente existente - Todos los campos opcionales"""
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    apellido: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    fecha_nacimiento: Optional[date] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None
    estado: Optional[str] = Field(None, pattern='^(activo|inactivo)$')
    
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

class ClienteEstadisticas(BaseModel):
    """Estadísticas del cliente"""
    total_visitas: int
    total_gastado: int  # En centavos
    fecha_primera_visita: Optional[datetime]
    fecha_ultima_visita: Optional[datetime]
    promedio_gasto_por_visita: int  # En centavos

class EtiquetaSimple(BaseModel):
    """Etiqueta simplificada para incluir en cliente"""
    id: int
    nombre: str
    color: str
    
    class Config:
        from_attributes = True

class ClienteResponse(ClienteBase):
    """Schema de respuesta completo de cliente"""
    id: int
    nombre_completo: str  # Property computada
    estado: str
    total_visitas: int
    fecha_primera_visita: Optional[date]
    ultima_visita: Optional[date]
    etiquetas: List[EtiquetaSimple] = []
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    
    class Config:
        from_attributes = True

class ClienteListResponse(BaseModel):
    """Schema de respuesta para listados (menos campos)"""
    id: int
    nombre: str
    apellido: Optional[str]
    nombre_completo: str  # Property computada
    telefono: Optional[str]
    email: Optional[str]
    total_visitas: int
    ultima_visita: Optional[date]
    etiquetas: List[EtiquetaSimple] = []
    estado: str
    
    class Config:
        from_attributes = True

# ============================================
# SCHEMAS DE BÚSQUEDA
# ============================================

class ClienteBusqueda(BaseModel):
    """Parámetros de búsqueda"""
    query: Optional[str] = Field(None, description="Búsqueda por nombre, teléfono o email")
    estado: Optional[str] = Field(None, pattern='^(activo|inactivo|todos)$')
    etiqueta_id: Optional[int] = Field(None, description="Filtrar por etiqueta")
    min_visitas: Optional[int] = Field(None, ge=0)
    max_visitas: Optional[int] = Field(None, ge=0)
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None

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
```

### Schemas de ClientePreferencia

**Archivo**: `app/schemas/cliente_preferencia.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

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
```

### Schemas de Etiqueta (ClienteEtiqueta)

**Archivo**: `app/schemas/cliente_etiqueta.py`

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import re

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
    total_clientes: int = 0  # Calculado
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class ClienteEtiquetaConClientes(ClienteEtiquetaResponse):
    """Etiqueta con lista de clientes"""
    clientes: List['ClienteListResponse'] = []
```

---

## ENDPOINTS DE API

### Estructura de Rutas

**Archivo**: `app/routers/clientes.py`

```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_user, require_permission
from app.schemas import cliente as schemas
from app.services import cliente_service
from app.models.usuario import Usuario

router = APIRouter(
    prefix="/api/clientes",
    tags=["Clientes"]
)
```

### 1. Endpoints CRUD de Clientes

#### BE-CLI-001: Listar Clientes con Paginación y Filtros

```python
@router.get(
    "",
    response_model=schemas.ClientePaginado,
    summary="Listar clientes con filtros y paginación",
    description="Obtiene lista paginada de clientes con opciones de búsqueda y filtrado"
)
def listar_clientes(
    query: Optional[str] = Query(None, description="Búsqueda por nombre, teléfono o email"),
    estado: Optional[str] = Query('activo', regex='^(activo|inactivo|todos)$'),
    etiqueta_id: Optional[int] = Query(None, description="Filtrar por etiqueta"),
    ciudad: Optional[str] = None,
    min_visitas: Optional[int] = Query(None, ge=0),
    max_visitas: Optional[int] = Query(None, ge=0),
    pagina: int = Query(1, ge=1, description="Número de página"),
    por_pagina: int = Query(20, ge=1, le=100, description="Items por página"),
    ordenar_por: str = Query('nombre_completo', description="Campo para ordenar"),
    orden: str = Query('asc', regex='^(asc|desc)$'),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.ver"))
):
    """
    Retorna lista paginada de clientes con:
    - Búsqueda por texto (nombre, teléfono, email)
    - Filtros por estado, etiqueta, ciudad, visitas
    - Ordenamiento configurable
    - Paginación
    """
    return cliente_service.listar_clientes_paginado(
        db=db,
        query=query,
        estado=estado,
        etiqueta_id=etiqueta_id,
        ciudad=ciudad,
        min_visitas=min_visitas,
        max_visitas=max_visitas,
        pagina=pagina,
        por_pagina=por_pagina,
        ordenar_por=ordenar_por,
        orden=orden
    )
```

#### BE-CLI-002: Obtener Cliente por ID

```python
@router.get(
    "/{cliente_id}",
    response_model=schemas.ClienteResponse,
    summary="Obtener cliente por ID",
    description="Obtiene información completa de un cliente específico"
)
def obtener_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.ver"))
):
    """
    Retorna información completa del cliente incluyendo:
    - Datos personales
    - Estadísticas
    - Etiquetas asignadas
    """
    cliente = cliente_service.obtener_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con ID {cliente_id} no encontrado"
        )
    return cliente
```

#### BE-CLI-003: Crear Cliente

```python
@router.post(
    "",
    response_model=schemas.ClienteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo cliente",
    description="Crea un nuevo cliente en el sistema"
)
def crear_cliente(
    cliente_data: schemas.ClienteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.crear"))
):
    """
    Crea un nuevo cliente validando:
    - Email único (si se proporciona)
    - Formato de teléfono
    - Datos obligatorios
    
    Automáticamente:
    - Genera nombre_completo
    - Establece estado 'activo'
    - Crea registro de preferencias vacío
    """
    try:
        cliente = cliente_service.crear_cliente(db, cliente_data, current_user.id)
        return cliente
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

#### BE-CLI-004: Actualizar Cliente

```python
@router.put(
    "/{cliente_id}",
    response_model=schemas.ClienteResponse,
    summary="Actualizar cliente",
    description="Actualiza información de un cliente existente"
)
def actualizar_cliente(
    cliente_id: int,
    cliente_data: schemas.ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.editar"))
):
    """
    Actualiza campos del cliente.
    Solo los campos enviados serán actualizados.
    """
    try:
        cliente = cliente_service.actualizar_cliente(
            db, cliente_id, cliente_data, current_user.id
        )
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cliente con ID {cliente_id} no encontrado"
            )
        return cliente
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

#### BE-CLI-005: Desactivar Cliente

```python
@router.delete(
    "/{cliente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desactivar cliente",
    description="Cambia el estado del cliente a 'inactivo' (soft delete)"
)
def desactivar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.eliminar"))
):
    """
    Desactiva un cliente (no lo elimina físicamente).
    El cliente no aparecerá en listados por defecto.
    """
    success = cliente_service.desactivar_cliente(db, cliente_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con ID {cliente_id} no encontrado"
        )
    return None
```

#### BE-CLI-006: Búsqueda Rápida de Clientes

```python
@router.get(
    "/buscar/rapida",
    response_model=List[schemas.ClienteListResponse],
    summary="Búsqueda rápida de clientes",
    description="Búsqueda rápida por nombre o teléfono (máximo 10 resultados)"
)
def busqueda_rapida(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.ver"))
):
    """
    Búsqueda rápida para autocompletado.
    Busca en nombre, apellido y teléfono.
    Retorna máximo 10 resultados por defecto.
    """
    return cliente_service.busqueda_rapida(db, q, limite)
```

### 2. Endpoints de Historial

#### BE-CLIHIST-001: Historial de Citas

```python
@router.get(
    "/{cliente_id}/citas",
    response_model=List[schemas.CitaResumen],
    summary="Historial de citas del cliente",
    description="Obtiene todas las citas del cliente ordenadas por fecha"
)
def historial_citas(
    cliente_id: int,
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    limite: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.ver"))
):
    """
    Retorna historial de citas incluyendo:
    - Servicios realizados
    - Especialista asignado
    - Estado de la cita
    - Notas
    """
    return cliente_service.obtener_historial_citas(
        db, cliente_id, estado, fecha_desde, fecha_hasta, limite
    )
```

#### BE-CLIHIST-002: Historial de Facturas

```python
@router.get(
    "/{cliente_id}/facturas",
    response_model=List[schemas.FacturaResumen],
    summary="Historial de facturas del cliente",
    description="Obtiene todas las facturas del cliente"
)
def historial_facturas(
    cliente_id: int,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    limite: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.ver"))
):
    """
    Retorna historial de facturas con:
    - Monto total
    - Servicios y productos
    - Método de pago
    - Estado
    """
    return cliente_service.obtener_historial_facturas(
        db, cliente_id, fecha_desde, fecha_hasta, limite
    )
```

#### BE-CLIHIST-003: Estadísticas del Cliente

```python
@router.get(
    "/{cliente_id}/estadisticas",
    response_model=schemas.ClienteEstadisticasDetalladas,
    summary="Estadísticas detalladas del cliente",
    description="Obtiene estadísticas completas del cliente"
)
def estadisticas_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.ver"))
):
    """
    Retorna estadísticas como:
    - Total de visitas y gasto
    - Promedio de gasto por visita
    - Servicios más frecuentes
    - Especialista preferido
    - Frecuencia de visitas
    - Última visita
    """
    return cliente_service.calcular_estadisticas_detalladas(db, cliente_id)
```

### 3. Endpoints de Preferencias

#### BE-CLIPREF-001: Obtener Preferencias

```python
@router.get(
    "/{cliente_id}/preferencias",
    response_model=schemas.ClientePreferenciaResponse,
    summary="Obtener preferencias del cliente",
    description="Obtiene las preferencias guardadas del cliente"
)
def obtener_preferencias(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.ver"))
):
    """
    Retorna preferencias del cliente incluyendo:
    - Servicios favoritos
    - Especialistas preferidos
    - Canales de comunicación
    - Alergias y condiciones
    """
    return cliente_service.obtener_preferencias(db, cliente_id)
```

#### BE-CLIPREF-002: Actualizar Preferencias

```python
@router.put(
    "/{cliente_id}/preferencias",
    response_model=schemas.ClientePreferenciaResponse,
    summary="Actualizar preferencias del cliente",
    description="Actualiza las preferencias del cliente"
)
def actualizar_preferencias(
    cliente_id: int,
    preferencias_data: schemas.ClientePreferenciaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.editar"))
):
    """
    Actualiza preferencias del cliente.
    Crea el registro si no existe.
    """
    return cliente_service.actualizar_preferencias(
        db, cliente_id, preferencias_data, current_user.id
    )
```

### 4. Endpoints de Etiquetas

#### BE-ETIQ-001: Listar Etiquetas

```python
@router.get(
    "/etiquetas",
    response_model=List[schemas.EtiquetaResponse],
    summary="Listar todas las etiquetas",
    description="Obtiene lista de etiquetas disponibles"
)
def listar_etiquetas(
    incluir_totales: bool = Query(True, description="Incluir conteo de clientes"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.ver"))
):
    """
    Retorna todas las etiquetas con opción de incluir
    el total de clientes asociados a cada una.
    """
    return cliente_service.listar_etiquetas(db, incluir_totales)
```

#### BE-ETIQ-002: Crear Etiqueta

```python
@router.post(
    "/etiquetas",
    response_model=schemas.EtiquetaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva etiqueta",
    description="Crea una nueva etiqueta para segmentación de clientes"
)
def crear_etiqueta(
    etiqueta_data: schemas.EtiquetaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.crear"))
):
    """
    Crea una nueva etiqueta validando:
    - Nombre único
    - Color en formato HEX válido
    """
    try:
        return cliente_service.crear_etiqueta(db, etiqueta_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

#### BE-ETIQ-003: Eliminar Etiqueta

```python
@router.delete(
    "/etiquetas/{etiqueta_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar etiqueta",
    description="Elimina una etiqueta (se desvincula de todos los clientes)"
)
def eliminar_etiqueta(
    etiqueta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.eliminar"))
):
    """
    Elimina una etiqueta.
    Se eliminan automáticamente todas las asociaciones con clientes.
    """
    success = cliente_service.eliminar_etiqueta(db, etiqueta_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Etiqueta con ID {etiqueta_id} no encontrada"
        )
    return None
```

#### BE-CLI-ETIQ-001: Asignar Etiquetas a Cliente

```python
@router.post(
    "/{cliente_id}/etiquetas",
    response_model=schemas.ClienteResponse,
    summary="Asignar etiquetas a cliente",
    description="Asigna una o varias etiquetas a un cliente"
)
def asignar_etiquetas(
    cliente_id: int,
    etiqueta_ids: List[int],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.editar"))
):
    """
    Asigna etiquetas a un cliente.
    Si alguna etiqueta ya estaba asignada, se ignora.
    """
    try:
        return cliente_service.asignar_etiquetas(db, cliente_id, etiqueta_ids)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

#### BE-CLI-ETIQ-002: Remover Etiqueta de Cliente

```python
@router.delete(
    "/{cliente_id}/etiquetas/{etiqueta_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover etiqueta de cliente",
    description="Elimina la asociación de una etiqueta con un cliente"
)
def remover_etiqueta(
    cliente_id: int,
    etiqueta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.editar"))
):
    """
    Remueve una etiqueta específica de un cliente.
    """
    success = cliente_service.remover_etiqueta(db, cliente_id, etiqueta_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asociación no encontrada"
        )
    return None
```

### 5. Endpoints de Exportación

#### BE-CLI-EXP-001: Exportar Clientes a Excel

```python
@router.get(
    "/exportar/excel",
    summary="Exportar clientes a Excel",
    description="Genera archivo Excel con lista de clientes filtrada"
)
def exportar_excel(
    query: Optional[str] = None,
    estado: Optional[str] = 'activo',
    etiqueta_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("clientes.exportar"))
):
    """
    Genera un archivo Excel con los clientes filtrados.
    Incluye todos los campos relevantes.
    """
    from fastapi.responses import StreamingResponse
    import io
    
    excel_bytes = cliente_service.exportar_excel(
        db, query, estado, etiqueta_id
    )
    
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=clientes_export.xlsx"
        }
    )
```

---

## SERVICIOS DE NEGOCIO

### ClienteService

**Archivo**: `app/services/cliente_service.py`

```python
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, desc
from typing import Optional, List
from datetime import date, datetime
from app.models.cliente import Cliente
from app.models.cliente_preferencia import ClientePreferencia
from app.models.etiqueta import Etiqueta
from app.models.cliente_etiqueta import ClienteEtiqueta
from app.schemas import cliente as schemas
import json

class ClienteService:
    """Servicio para la lógica de negocio de clientes"""
    
    @staticmethod
    def listar_clientes_paginado(
        db: Session,
        query: Optional[str] = None,
        estado: str = 'activo',
        etiqueta_id: Optional[int] = None,
        ciudad: Optional[str] = None,
        min_visitas: Optional[int] = None,
        max_visitas: Optional[int] = None,
        pagina: int = 1,
        por_pagina: int = 20,
        ordenar_por: str = 'nombre_completo',
        orden: str = 'asc'
    ) -> dict:
        """
        Lista clientes con filtros, búsqueda y paginación
        """
        # Query base
        q = db.query(Cliente)
        
        # Filtro por estado
        if estado != 'todos':
            q = q.filter(Cliente.estado == estado)
        
        # Búsqueda por texto
        if query:
            search_term = f"%{query}%"
            q = q.filter(
                or_(
                    Cliente.nombre_completo.ilike(search_term),
                    Cliente.telefono.ilike(search_term),
                    Cliente.email.ilike(search_term)
                )
            )
        
        # Filtro por etiqueta
        if etiqueta_id:
            q = q.join(ClienteEtiqueta).filter(
                ClienteEtiqueta.etiqueta_id == etiqueta_id
            )
        
        # Filtro por ciudad
        if ciudad:
            q = q.filter(Cliente.ciudad.ilike(f"%{ciudad}%"))
        
        # Filtro por rango de visitas
        if min_visitas is not None:
            q = q.filter(Cliente.total_visitas >= min_visitas)
        if max_visitas is not None:
            q = q.filter(Cliente.total_visitas <= max_visitas)
        
        # Total de registros
        total = q.count()
        
        # Ordenamiento
        if hasattr(Cliente, ordenar_por):
            campo_orden = getattr(Cliente, ordenar_por)
            if orden == 'desc':
                q = q.order_by(desc(campo_orden))
            else:
                q = q.order_by(campo_orden)
        
        # Paginación
        offset = (pagina - 1) * por_pagina
        clientes = q.offset(offset).limit(por_pagina).all()
        
        # Calcular total de páginas
        total_paginas = (total + por_pagina - 1) // por_pagina
        
        return {
            'total': total,
            'pagina': pagina,
            'por_pagina': por_pagina,
            'total_paginas': total_paginas,
            'items': clientes
        }
    
    @staticmethod
    def obtener_cliente(db: Session, cliente_id: int) -> Optional[Cliente]:
        """
        Obtiene un cliente por ID con sus relaciones cargadas
        """
        return db.query(Cliente).options(
            joinedload(Cliente.etiquetas).joinedload(ClienteEtiqueta.etiqueta),
            joinedload(Cliente.preferencias)
        ).filter(Cliente.id == cliente_id).first()
    
    @staticmethod
    def crear_cliente(
        db: Session,
        cliente_data: schemas.ClienteCreate,
        usuario_id: int
    ) -> Cliente:
        """
        Crea un nuevo cliente
        """
        # Validar email único si se proporciona
        if cliente_data.email:
            existe = db.query(Cliente).filter(
                Cliente.email == cliente_data.email
            ).first()
            if existe:
                raise ValueError(f"El email {cliente_data.email} ya está registrado")
        
        # Crear cliente
        cliente_dict = cliente_data.model_dump(exclude_unset=True)
        
        # Generar nombre completo
        nombre_completo = cliente_dict['nombre']
        if cliente_dict.get('apellido'):
            nombre_completo += f" {cliente_dict['apellido']}"
        cliente_dict['nombre_completo'] = nombre_completo
        
        cliente = Cliente(**cliente_dict)
        db.add(cliente)
        db.flush()  # Para obtener el ID
        
        # Crear registro de preferencias vacío
        preferencia = ClientePreferencia(cliente_id=cliente.id)
        db.add(preferencia)
        
        # Log de auditoría
        from app.services.auditoria_service import registrar_auditoria
        registrar_auditoria(
            db=db,
            usuario_id=usuario_id,
            accion='crear',
            modulo='clientes',
            entidad='cliente',
            entidad_id=cliente.id,
            datos_nuevos=cliente_dict
        )
        
        db.commit()
        db.refresh(cliente)
        return cliente
    
    @staticmethod
    def actualizar_cliente(
        db: Session,
        cliente_id: int,
        cliente_data: schemas.ClienteUpdate,
        usuario_id: int
    ) -> Optional[Cliente]:
        """
        Actualiza un cliente existente
        """
        cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            return None
        
        # Guardar datos anteriores para auditoría
        datos_anteriores = {
            'nombre': cliente.nombre,
            'apellido': cliente.apellido,
            'telefono': cliente.telefono,
            'email': cliente.email,
            'estado': cliente.estado
        }
        
        # Validar email único si se está cambiando
        update_dict = cliente_data.model_dump(exclude_unset=True)
        if 'email' in update_dict and update_dict['email'] != cliente.email:
            existe = db.query(Cliente).filter(
                Cliente.email == update_dict['email'],
                Cliente.id != cliente_id
            ).first()
            if existe:
                raise ValueError(f"El email {update_dict['email']} ya está registrado")
        
        # Actualizar campos
        for campo, valor in update_dict.items():
            setattr(cliente, campo, valor)
        
        # Actualizar nombre completo si cambió nombre o apellido
        if 'nombre' in update_dict or 'apellido' in update_dict:
            nombre_completo = cliente.nombre
            if cliente.apellido:
                nombre_completo += f" {cliente.apellido}"
            cliente.nombre_completo = nombre_completo
        
        # Log de auditoría
        from app.services.auditoria_service import registrar_auditoria
        registrar_auditoria(
            db=db,
            usuario_id=usuario_id,
            accion='actualizar',
            modulo='clientes',
            entidad='cliente',
            entidad_id=cliente.id,
            datos_anteriores=datos_anteriores,
            datos_nuevos=update_dict
        )
        
        db.commit()
        db.refresh(cliente)
        return cliente
    
    @staticmethod
    def desactivar_cliente(
        db: Session,
        cliente_id: int,
        usuario_id: int
    ) -> bool:
        """
        Desactiva un cliente (soft delete)
        """
        cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            return False
        
        cliente.estado = 'inactivo'
        
        # Log de auditoría
        from app.services.auditoria_service import registrar_auditoria
        registrar_auditoria(
            db=db,
            usuario_id=usuario_id,
            accion='desactivar',
            modulo='clientes',
            entidad='cliente',
            entidad_id=cliente.id,
            datos_anteriores={'estado': 'activo'},
            datos_nuevos={'estado': 'inactivo'}
        )
        
        db.commit()
        return True
    
    @staticmethod
    def busqueda_rapida(
        db: Session,
        query: str,
        limite: int = 10
    ) -> List[Cliente]:
        """
        Búsqueda rápida para autocompletado
        """
        search_term = f"%{query}%"
        return db.query(Cliente).filter(
            and_(
                Cliente.estado == 'activo',
                or_(
                    Cliente.nombre_completo.ilike(search_term),
                    Cliente.telefono.ilike(search_term)
                )
            )
        ).limit(limite).all()
    
    @staticmethod
    def obtener_historial_citas(
        db: Session,
        cliente_id: int,
        estado: Optional[str] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        limite: int = 50
    ):
        """
        Obtiene historial de citas del cliente
        """
        from app.models.cita import Cita
        
        q = db.query(Cita).filter(Cita.cliente_id == cliente_id)
        
        if estado:
            q = q.filter(Cita.estado == estado)
        if fecha_desde:
            q = q.filter(Cita.fecha >= fecha_desde)
        if fecha_hasta:
            q = q.filter(Cita.fecha <= fecha_hasta)
        
        return q.order_by(desc(Cita.fecha), desc(Cita.hora_inicio)).limit(limite).all()
    
    @staticmethod
    def obtener_historial_facturas(
        db: Session,
        cliente_id: int,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        limite: int = 50
    ):
        """
        Obtiene historial de facturas del cliente
        """
        from app.models.factura import Factura
        
        q = db.query(Factura).filter(Factura.cliente_id == cliente_id)
        
        if fecha_desde:
            q = q.filter(Factura.fecha >= fecha_desde)
        if fecha_hasta:
            q = q.filter(Factura.fecha <= fecha_hasta)
        
        return q.order_by(desc(Factura.fecha)).limit(limite).all()
    
    @staticmethod
    def calcular_estadisticas_detalladas(db: Session, cliente_id: int) -> dict:
        """
        Calcula estadísticas detalladas del cliente
        """
        from app.models.cita import Cita
        from app.models.factura import Factura
        from app.models.factura_servicio import FacturaServicio
        
        cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            raise ValueError("Cliente no encontrado")
        
        # Servicio más frecuente
        servicio_frecuente = db.query(
            FacturaServicio.servicio_id,
            func.count(FacturaServicio.id).label('cantidad')
        ).join(Factura).filter(
            Factura.cliente_id == cliente_id,
            Factura.estado == 'pagada'
        ).group_by(
            FacturaServicio.servicio_id
        ).order_by(
            desc('cantidad')
        ).first()
        
        # Especialista preferido
        especialista_frecuente = db.query(
            Cita.especialista_id,
            func.count(Cita.id).label('cantidad')
        ).filter(
            Cita.cliente_id == cliente_id,
            Cita.estado == 'completada'
        ).group_by(
            Cita.especialista_id
        ).order_by(
            desc('cantidad')
        ).first()
        
        # Promedio de gasto
        promedio_gasto = 0
        if cliente.total_visitas > 0:
            promedio_gasto = cliente.total_gastado // cliente.total_visitas
        
        return {
            'total_visitas': cliente.total_visitas,
            'total_gastado': cliente.total_gastado,
            'promedio_gasto_por_visita': promedio_gasto,
            'fecha_primera_visita': cliente.fecha_primera_visita,
            'fecha_ultima_visita': cliente.fecha_ultima_visita,
            'servicio_mas_frecuente_id': servicio_frecuente[0] if servicio_frecuente else None,
            'especialista_preferido_id': especialista_frecuente[0] if especialista_frecuente else None
        }
```

### Servicios Adicionales

```python
    @staticmethod
    def obtener_preferencias(db: Session, cliente_id: int) -> Optional[ClientePreferencia]:
        """Obtiene o crea preferencias del cliente"""
        preferencia = db.query(ClientePreferencia).filter(
            ClientePreferencia.cliente_id == cliente_id
        ).first()
        
        if not preferencia:
            # Crear preferencias por defecto
            preferencia = ClientePreferencia(cliente_id=cliente_id)
            db.add(preferencia)
            db.commit()
            db.refresh(preferencia)
        
        return preferencia
    
    @staticmethod
    def actualizar_preferencias(
        db: Session,
        cliente_id: int,
        preferencias_data: schemas.ClientePreferenciaUpdate,
        usuario_id: int
    ) -> ClientePreferencia:
        """Actualiza preferencias del cliente"""
        preferencia = ClienteService.obtener_preferencias(db, cliente_id)
        
        update_dict = preferencias_data.model_dump(exclude_unset=True)
        
        # Convertir listas a JSON para almacenar
        if 'servicios_favoritos' in update_dict:
            update_dict['servicios_favoritos'] = json.dumps(update_dict['servicios_favoritos'])
        if 'especialistas_preferidos' in update_dict:
            update_dict['especialistas_preferidos'] = json.dumps(update_dict['especialistas_preferidos'])
        
        for campo, valor in update_dict.items():
            setattr(preferencia, campo, valor)
        
        db.commit()
        db.refresh(preferencia)
        return preferencia
    
    @staticmethod
    def listar_etiquetas(db: Session, incluir_totales: bool = True) -> List[Etiqueta]:
        """Lista todas las etiquetas con conteos opcionales"""
        q = db.query(Etiqueta)
        
        if incluir_totales:
            q = q.outerjoin(ClienteEtiqueta).group_by(Etiqueta.id)
            # Agregar conteo como atributo adicional
        
        return q.all()
    
    @staticmethod
    def crear_etiqueta(db: Session, etiqueta_data: schemas.EtiquetaCreate) -> Etiqueta:
        """Crea una nueva etiqueta"""
        # Validar nombre único
        existe = db.query(Etiqueta).filter(
            Etiqueta.nombre == etiqueta_data.nombre
        ).first()
        if existe:
            raise ValueError(f"Ya existe una etiqueta con el nombre '{etiqueta_data.nombre}'")
        
        etiqueta = Etiqueta(**etiqueta_data.model_dump())
        db.add(etiqueta)
        db.commit()
        db.refresh(etiqueta)
        return etiqueta
    
    @staticmethod
    def eliminar_etiqueta(db: Session, etiqueta_id: int) -> bool:
        """Elimina una etiqueta"""
        etiqueta = db.query(Etiqueta).filter(Etiqueta.id == etiqueta_id).first()
        if not etiqueta:
            return False
        
        db.delete(etiqueta)
        db.commit()
        return True
    
    @staticmethod
    def asignar_etiquetas(
        db: Session,
        cliente_id: int,
        etiqueta_ids: List[int]
    ) -> Cliente:
        """Asigna etiquetas a un cliente"""
        cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            raise ValueError("Cliente no encontrado")
        
        for etiqueta_id in etiqueta_ids:
            # Verificar que la etiqueta existe
            etiqueta = db.query(Etiqueta).filter(Etiqueta.id == etiqueta_id).first()
            if not etiqueta:
                continue
            
            # Verificar si ya está asignada
            existe = db.query(ClienteEtiqueta).filter(
                ClienteEtiqueta.cliente_id == cliente_id,
                ClienteEtiqueta.etiqueta_id == etiqueta_id
            ).first()
            
            if not existe:
                cliente_etiqueta = ClienteEtiqueta(
                    cliente_id=cliente_id,
                    etiqueta_id=etiqueta_id
                )
                db.add(cliente_etiqueta)
        
        db.commit()
        db.refresh(cliente)
        return cliente
    
    @staticmethod
    def remover_etiqueta(
        db: Session,
        cliente_id: int,
        etiqueta_id: int
    ) -> bool:
        """Remueve una etiqueta de un cliente"""
        cliente_etiqueta = db.query(ClienteEtiqueta).filter(
            ClienteEtiqueta.cliente_id == cliente_id,
            ClienteEtiqueta.etiqueta_id == etiqueta_id
        ).first()
        
        if not cliente_etiqueta:
            return False
        
        db.delete(cliente_etiqueta)
        db.commit()
        return True
    
    @staticmethod
    def exportar_excel(
        db: Session,
        query: Optional[str] = None,
        estado: str = 'activo',
        etiqueta_id: Optional[int] = None
    ) -> bytes:
        """Exporta clientes a Excel"""
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill
        from io import BytesIO
        
        # Obtener clientes con filtros
        clientes = ClienteService.listar_clientes_paginado(
            db=db,
            query=query,
            estado=estado,
            etiqueta_id=etiqueta_id,
            pagina=1,
            por_pagina=10000  # Obtener todos
        )['items']
        
        # Crear workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Clientes"
        
        # Headers
        headers = [
            'ID', 'Nombre Completo', 'Teléfono', 'Email', 
            'Ciudad', 'Total Visitas', 'Total Gastado', 
            'Última Visita', 'Estado', 'Etiquetas'
        ]
        
        # Estilo de headers
        header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True)
        
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.fill = header_fill
            cell.font = header_font
        
        # Datos
        for row, cliente in enumerate(clientes, 2):
            etiquetas = ', '.join([ce.etiqueta.nombre for ce in cliente.etiquetas])
            total_gastado_formatted = f"${cliente.total_gastado / 100:,.2f}"
            
            ws.cell(row, 1, cliente.id)
            ws.cell(row, 2, cliente.nombre_completo)
            ws.cell(row, 3, cliente.telefono or '')
            ws.cell(row, 4, cliente.email or '')
            ws.cell(row, 5, cliente.ciudad or '')
            ws.cell(row, 6, cliente.total_visitas)
            ws.cell(row, 7, total_gastado_formatted)
            ws.cell(row, 8, cliente.fecha_ultima_visita.strftime('%Y-%m-%d') if cliente.fecha_ultima_visita else '')
            ws.cell(row, 9, cliente.estado)
            ws.cell(row, 10, etiquetas)
        
        # Ajustar anchos de columna
        for col in ws.columns:
            max_length = 0
            column = col[0].column_letter
            for cell in col:
                if len(str(cell.value)) > max_length:
                    max_length = len(cell.value)
            adjusted_width = min(max_length + 2, 50)
            ws.column_dimensions[column].width = adjusted_width
        
        # Guardar en BytesIO
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        return output.getvalue()

# Instancia singleton
cliente_service = ClienteService()
```

---

## REGLAS DE NEGOCIO

### RN-CLI-001: Nombre Obligatorio
- El campo `nombre` es obligatorio al crear un cliente
- Longitud mínima: 2 caracteres
- Longitud máxima: 100 caracteres

### RN-CLI-002: Validación de Teléfono
- Formato: acepta números con o sin código de país (+)
- Longitud: entre 7 y 15 dígitos
- Se eliminan automáticamente espacios, guiones y paréntesis
- Ejemplo válido: `+573001234567`, `3001234567`, `300-123-4567`

### RN-CLI-003: Validación de Email
- Debe ser un email válido según estándar RFC 5322
- Debe ser único en el sistema (si se proporciona)
- Puede ser NULL/opcional

### RN-CLI-004: Nombre Completo Automático
- Se genera automáticamente como: `nombre + " " + apellido`
- Se actualiza automáticamente al cambiar nombre o apellido
- Se usa para búsquedas y ordenamiento

### RN-CLI-005: Fecha de Primera Visita
- Se establece automáticamente cuando se completa la primera cita
- Se actualiza mediante trigger en la base de datos
- No se modifica manualmente

### RN-CLI-006: Estadísticas Automáticas
- `total_visitas`: se incrementa al completar cada cita
- `total_gastado`: se suma al pagar cada factura
- `fecha_ultima_visita`: se actualiza al completar cita
- Gestionado por triggers en PostgreSQL

### RN-CLI-007: Búsqueda por Nombre Parcial
- La búsqueda es case-insensitive
- Busca en: nombre, apellido, nombre_completo, teléfono, email
- Usa operador ILIKE de PostgreSQL

### RN-CLI-008: Soft Delete
- Los clientes no se eliminan físicamente
- Se cambia el estado a 'inactivo'
- Los clientes inactivos no aparecen en listados por defecto
- Se mantienen todas las relaciones históricas

### RN-CLI-009: Validación de Edad
- Si se proporciona fecha de nacimiento, el cliente debe tener al menos 10 años
- La fecha de nacimiento no puede ser futura

### RN-CLI-010: Etiquetas Múltiples
- Un cliente puede tener múltiples etiquetas
- Una etiqueta puede estar asignada a múltiples clientes
- Al eliminar una etiqueta, se eliminan todas sus asociaciones

### RN-CLI-011: Preferencias por Defecto
- Al crear un cliente, se crea automáticamente un registro de preferencias vacío
- Valores por defecto:
  - `prefiere_email`: 'si'
  - `prefiere_sms`: 'si'
  - `prefiere_whatsapp`: 'si'

### RN-CLI-012: Email Único
- Si se proporciona email, debe ser único
- Validación al crear y actualizar
- Si se intenta duplicar, se lanza error 400

### RN-CLI-013: Historial Inmutable
- Las citas y facturas completadas no se modifican al editar cliente
- El historial se mantiene para auditoría

### RN-CLI-014: Exportación con Filtros
- La exportación Excel respeta todos los filtros aplicados
- Máximo 10,000 registros por exportación
- Include todos los campos principales

### RN-CLI-015: Auditabilidad
- Todas las operaciones CRUD se registran en log_auditoria
- Se guardan datos anteriores y nuevos
- Se registra el usuario que realizó la acción

---

## VALIDACIONES

### Validaciones de Entrada

#### Validación de Teléfono
```python
def validar_telefono(telefono: str) -> str:
    """
    Valida y normaliza número telefónico
    - Remueve espacios, guiones, paréntesis
    - Valida longitud (7-15 dígitos)
    - Permite código de país opcional (+)
    """
    if not telefono:
        return None
    
    telefono_limpio = re.sub(r'[\s\-\(\)]', '', telefono)
    
    if not re.match(r'^\+?\d{7,15}$', telefono_limpio):
        raise ValueError('Formato de teléfono inválido')
    
    return telefono_limpio
```

#### Validación de Email
```python
# Manejado por Pydantic EmailStr
# Valida formato RFC 5322
```

#### Validación de Fecha de Nacimiento
```python
def validar_fecha_nacimiento(fecha: date) -> date:
    """
    Valida que:
    - No sea fecha futura
    - Cliente tenga al menos 10 años
    """
    if fecha > date.today():
        raise ValueError('La fecha de nacimiento no puede ser futura')
    
    edad = (date.today() - fecha).days // 365
    if edad < 10:
        raise ValueError('El cliente debe tener al menos 10 años')
    
    return fecha
```

### Validaciones de Negocio

#### Email Único
```python
def validar_email_unico(db: Session, email: str, cliente_id: Optional[int] = None):
    """Valida que el email no esté en uso"""
    q = db.query(Cliente).filter(Cliente.email == email)
    if cliente_id:
        q = q.filter(Cliente.id != cliente_id)
    
    if q.first():
        raise ValueError(f"El email {email} ya está registrado")
```

#### Etiqueta Única
```python
def validar_etiqueta_unica(db: Session, nombre: str):
    """Valida que el nombre de etiqueta no exista"""
    existe = db.query(Etiqueta).filter(Etiqueta.nombre == nombre).first()
    if existe:
        raise ValueError(f"Ya existe una etiqueta con el nombre '{nombre}'")
```

---

## JOBS Y TAREAS PROGRAMADAS

### Job de Cumpleaños

**Archivo**: `app/jobs/cliente_jobs.py`

```python
from celery import shared_task
from app.database import SessionLocal
from app.models.cliente import Cliente
from app.services.notificacion_service import enviar_email
from datetime import date

@shared_task
def enviar_felicitaciones_cumpleanos():
    """
    Job que se ejecuta diariamente a las 8:00 AM
    Envía felicitaciones a clientes que cumplen años hoy
    """
    db = SessionLocal()
    try:
        hoy = date.today()
        
        # Buscar clientes con cumpleaños hoy
        clientes = db.query(Cliente).filter(
            Cliente.estado == 'activo',
            Cliente.email.isnot(None),
            func.extract('month', Cliente.fecha_nacimiento) == hoy.month,
            func.extract('day', Cliente.fecha_nacimiento) == hoy.day
        ).all()
        
        for cliente in clientes:
            # Verificar preferencias de comunicación
            if cliente.preferencias and cliente.preferencias.prefiere_email == 'si':
                enviar_email(
                    destinatario=cliente.email,
                    asunto=f"¡Feliz Cumpleaños {cliente.nombre}! 🎉",
                    template='cumpleanos',
                    contexto={
                        'nombre': cliente.nombre,
                        'salon': 'Club de Alisados'
                    }
                )
        
        return f"Se enviaron felicitaciones a {len(clientes)} clientes"
    
    finally:
        db.close()
```

### Job de Clientes Inactivos

```python
@shared_task
def identificar_clientes_inactivos():
    """
    Job que se ejecuta semanalmente
    Identifica clientes sin visitas en los últimos 90 días
    """
    db = SessionLocal()
    try:
        from datetime import timedelta
        fecha_limite = date.today() - timedelta(days=90)
        
        clientes_inactivos = db.query(Cliente).filter(
            Cliente.estado == 'activo',
            Cliente.fecha_ultima_visita < fecha_limite
        ).all()
        
        # Asignar etiqueta "Inactivo" o enviar reporte
        # ...
        
        return f"Se identificaron {len(clientes_inactivos)} clientes inactivos"
    
    finally:
        db.close()
```

### Registro de Jobs en Celery Beat

```python
# app/celery_config.py
from celery.schedules import crontab

beat_schedule = {
    'enviar-cumpleanos': {
        'task': 'app.jobs.cliente_jobs.enviar_felicitaciones_cumpleanos',
        'schedule': crontab(hour=8, minute=0),  # Diario a las 8:00 AM
    },
    'identificar-inactivos': {
        'task': 'app.jobs.cliente_jobs.identificar_clientes_inactivos',
        'schedule': crontab(day_of_week=1, hour=9, minute=0),  # Lunes 9:00 AM
    },
}
```

---

## CONSIDERACIONES DE SEGURIDAD

### 1. Control de Acceso (RBAC)

Permisos requeridos para cada operación:

| Operación | Permiso Requerido |
|-----------|------------------|
| Listar clientes | `clientes.ver` |
| Ver detalle | `clientes.ver` |
| Crear cliente | `clientes.crear` |
| Actualizar cliente | `clientes.editar` |
| Desactivar cliente | `clientes.eliminar` |
| Exportar | `clientes.exportar` |
| Ver historial | `clientes.ver` |
| Gestionar preferencias | `clientes.editar` |
| Gestionar etiquetas | `clientes.crear`, `clientes.editar` |

### 2. Validación de Datos

- **Sanitización de entrada**: Todos los campos string se validan con Pydantic
- **Inyección SQL**: Uso de SQLAlchemy ORM previene SQL injection
- **XSS**: FastAPI escapa automáticamente respuestas JSON

### 3. Privacidad de Datos (GDPR)

- **Datos sensibles**: fecha_nacimiento, email, teléfono se manejan con cuidado
- **Consentimiento**: Campo en preferencias para comunicaciones
- **Derecho al olvido**: Soft delete permite mantener historial sin exponer datos
- **Anonimización**: Opción futura de anonimizar cliente manteniendo estadísticas

### 4. Auditoría

Todas las operaciones se registran en `log_auditoria`:
- Usuario que realizó la acción
- Timestamp
- Datos anteriores y nuevos
- IP del usuario

### 5. Rate Limiting

Endpoints de búsqueda y listado deberían tener rate limiting:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.get("/api/clientes/buscar")
@limiter.limit("60/minute")
def busqueda_rapida(...):
    ...
```

---

## TESTING

### 1. Tests Unitarios

#### Test de Validaciones

```python
# tests/test_schemas/test_cliente_schemas.py
import pytest
from app.schemas.cliente import ClienteCreate

def test_telefono_valido():
    """Test validación de teléfono correcto"""
    cliente = ClienteCreate(
        nombre="Juan",
        telefono="+573001234567"
    )
    assert cliente.telefono == "+573001234567"

def test_telefono_invalido():
    """Test validación de teléfono incorrecto"""
    with pytest.raises(ValueError):
        ClienteCreate(
            nombre="Juan",
            telefono="123"  # Muy corto
        )

def test_email_invalido():
    """Test validación de email incorrecto"""
    with pytest.raises(ValueError):
        ClienteCreate(
            nombre="Juan",
            email="no-es-email"
        )

def test_fecha_nacimiento_futura():
    """Test validación de fecha futura"""
    from datetime import date, timedelta
    fecha_futura = date.today() + timedelta(days=1)
    
    with pytest.raises(ValueError):
        ClienteCreate(
            nombre="Juan",
            fecha_nacimiento=fecha_futura
        )
```

#### Test de Servicios

```python
# tests/test_services/test_cliente_service.py
import pytest
from app.services.cliente_service import ClienteService
from app.schemas.cliente import ClienteCreate

def test_crear_cliente(db_session):
    """Test creación de cliente"""
    cliente_data = ClienteCreate(
        nombre="Juan",
        apellido="Pérez",
        telefono="+573001234567",
        email="juan@example.com"
    )
    
    cliente = ClienteService.crear_cliente(
        db=db_session,
        cliente_data=cliente_data,
        usuario_id=1
    )
    
    assert cliente.id is not None
    assert cliente.nombre_completo == "Juan Pérez"
    assert cliente.estado == "activo"
    assert cliente.total_visitas == 0

def test_email_duplicado(db_session):
    """Test validación de email único"""
    cliente_data = ClienteCreate(
        nombre="Juan",
        email="duplicado@example.com"
    )
    
    # Crear primero
    ClienteService.crear_cliente(db_session, cliente_data, 1)
    
    # Intentar duplicar
    with pytest.raises(ValueError, match="ya está registrado"):
        ClienteService.crear_cliente(db_session, cliente_data, 1)

def test_busqueda_rapida(db_session, cliente_factory):
    """Test búsqueda rápida"""
    # Crear clientes de prueba
    cliente_factory(nombre="Juan", apellido="Pérez")
    cliente_factory(nombre="María", apellido="García")
    
    resultados = ClienteService.busqueda_rapida(
        db=db_session,
        query="Juan",
        limite=10
    )
    
    assert len(resultados) == 1
    assert resultados[0].nombre == "Juan"
```

### 2. Tests de Integración

```python
# tests/test_api/test_clientes_endpoints.py
from fastapi.testclient import TestClient

def test_listar_clientes(client: TestClient, auth_headers):
    """Test endpoint listar clientes"""
    response = client.get(
        "/api/clientes",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert 'items' in data
    assert 'total' in data
    assert 'pagina' in data

def test_crear_cliente(client: TestClient, auth_headers):
    """Test endpoint crear cliente"""
    nuevo_cliente = {
        "nombre": "Juan",
        "apellido": "Pérez",
        "telefono": "+573001234567",
        "email": "juan@example.com"
    }
    
    response = client.post(
        "/api/clientes",
        json=nuevo_cliente,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data['nombre'] == "Juan"
    assert data['nombre_completo'] == "Juan Pérez"
    assert 'id' in data

def test_crear_cliente_sin_permiso(client: TestClient, auth_headers_sin_permiso):
    """Test endpoint crear sin permiso"""
    nuevo_cliente = {"nombre": "Juan"}
    
    response = client.post(
        "/api/clientes",
        json=nuevo_cliente,
        headers=auth_headers_sin_permiso
    )
    
    assert response.status_code == 403

def test_obtener_cliente(client: TestClient, auth_headers, cliente_existente):
    """Test endpoint obtener cliente"""
    response = client.get(
        f"/api/clientes/{cliente_existente.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['id'] == cliente_existente.id
    assert data['nombre'] == cliente_existente.nombre

def test_actualizar_cliente(client: TestClient, auth_headers, cliente_existente):
    """Test endpoint actualizar cliente"""
    actualizacion = {
        "telefono": "+573009999999"
    }
    
    response = client.put(
        f"/api/clientes/{cliente_existente.id}",
        json=actualizacion,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['telefono'] == "+573009999999"
```

### 3. Fixtures de Prueba

```python
# tests/conftest.py
import pytest
from app.models.cliente import Cliente
from app.models.cliente_preferencia import ClientePreferencia

@pytest.fixture
def cliente_factory(db_session):
    """Factory para crear clientes de prueba"""
    def _crear_cliente(**kwargs):
        defaults = {
            'nombre': 'Juan',
            'apellido': 'Pérez',
            'telefono': '+573001234567',
            'estado': 'activo',
            'total_visitas': 0,
            'total_gastado': 0
        }
        defaults.update(kwargs)
        
        nombre_completo = f"{defaults['nombre']} {defaults.get('apellido', '')}"
        defaults['nombre_completo'] = nombre_completo.strip()
        
        cliente = Cliente(**defaults)
        db_session.add(cliente)
        db_session.flush()
        
        # Crear preferencias
        pref = ClientePreferencia(cliente_id=cliente.id)
        db_session.add(pref)
        
        db_session.commit()
        db_session.refresh(cliente)
        return cliente
    
    return _crear_cliente

@pytest.fixture
def cliente_existente(cliente_factory):
    """Cliente de prueba ya creado"""
    return cliente_factory(
        nombre="María",
        apellido="García",
        email="maria@example.com"
    )
```

### 4. Cobertura de Tests

**Objetivo de cobertura**: >80%

Áreas críticas a testear:
- ✅ Validaciones de schemas
- ✅ Lógica de negocio en servicios
- ✅ Endpoints de API
- ✅ Permisos y autenticación
- ✅ Casos edge (emails duplicados, teléfonos inválidos, etc.)
- ✅ Búsquedas y filtros
- ✅ Paginación
- ✅ Exportación

---

## DEPENDENCIAS CON OTROS MÓDULOS

### Módulos que Dependen de Clientes

#### 1. Agenda/Calendario (CRÍTICO)
```python
# Una cita requiere un cliente
cita.cliente_id → clientes.id
```
**Endpoints afectados**:
- `POST /api/citas` - Requiere cliente_id válido
- `GET /api/calendario/*` - Muestra nombre del cliente

**Validaciones**:
- El cliente debe existir y estar activo
- El cliente debe tener teléfono para recordatorios

#### 2. Punto de Venta (CRÍTICO)
```python
# Una factura requiere un cliente
factura.cliente_id → clientes.id
```
**Endpoints afectados**:
- `POST /api/facturas` - Requiere cliente_id
- `GET /api/facturas/{id}` - Incluye datos del cliente

**Actualización automática**:
- Al pagar factura → incrementar `total_gastado`
- Al completar cita → incrementar `total_visitas`

#### 3. CRM (ALTA)
```python
# Comunicaciones están ligadas a clientes
comunicacion.cliente_id → clientes.id
```
**Funcionalidades**:
- Historial de comunicaciones
- Campañas de marketing segmentadas
- Recordatorios automáticos

#### 4. Reportes (ALTA)
```python
# Análisis de clientes
```
**Reportes generados**:
- Clientes más frecuentes
- Clientes con mayor gasto
- Tasa de retención
- Clientes inactivos

### Módulos de los que Depende Clientes

#### 1. Control de Acceso (CRÍTICO)
```python
# Todos los endpoints requieren autenticación
Depends(require_permission("clientes.ver"))
```

#### 2. Auditoría (CRÍTICO)
```python
# Registrar todas las operaciones
log_auditoria.entidad = 'cliente'
log_auditoria.entidad_id = cliente.id
```

---

## DIAGRAMAS

### Diagrama de Flujo: Crear Cliente

```
┌─────────────────┐
│  POST /clientes │
└────────┬────────┘
         │
         ▼
   ┌──────────┐
   │ Validar  │
   │  JWT     │
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Validar  │
   │ Permiso  │
   └────┬─────┘
        │
        ▼
   ┌──────────────┐
   │ Validar      │
   │ Schema       │
   │ (Pydantic)   │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐   No   ┌──────────┐
   │ Email único? ├───────►│ Error    │
   └────┬─────────┘        │ 400      │
        │ Sí               └──────────┘
        ▼
   ┌──────────────┐
   │ Crear        │
   │ Cliente      │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │ Crear        │
   │ Preferencias │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │ Log          │
   │ Auditoría    │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │ Commit DB    │
   └────┬─────────┘
        │
        ▼
   ┌──────────────┐
   │ Response     │
   │ 201 Created  │
   └──────────────┘
```

---

## CHANGELOG Y VERSIONES

### Versión 1.0 (Actual)
- ✅ CRUD completo de clientes
- ✅ Sistema de etiquetas
- ✅ Preferencias de cliente
- ✅ Búsqueda y filtros avanzados
- ✅ Historial de citas y facturas
- ✅ Estadísticas automáticas
- ✅ Exportación Excel
- ✅ Validaciones robustas
- ✅ Sistema de auditoría
- ✅ Tests completos

### Versión 1.1 (Planeada)
- 🔄 Importación masiva desde Excel/CSV
- 🔄 Fusión de clientes duplicados
- 🔄 Segmentación avanzada (RFM analysis)
- 🔄 Predicción de churn
- 🔄 Recomendaciones de servicios

---

## NOTAS FINALES

Este documento define la implementación completa del módulo de Gestión de Clientes para Club de Alisados. El módulo está diseñado para ser:

1. **Escalable**: Paginación y índices optimizados
2. **Seguro**: Validaciones, permisos y auditoría completa
3. **Mantenible**: Código modular y bien documentado
4. **Testeable**: Cobertura >80% con tests unitarios e integración

### Próximos Pasos

1. Implementar modelos SQLAlchemy
2. Crear schemas Pydantic con validaciones
3. Desarrollar servicios de negocio
4. Implementar endpoints de API
5. Escribir tests
6. Documentar en Swagger
7. Integrar con módulos dependientes

**Versión**: 1.0  
**Fecha**: Diciembre 2025  
**Autor**: Equipo de Desarrollo Club de Alisados  
**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN
