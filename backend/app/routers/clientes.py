from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..schemas.cliente import (
    ClienteCreate, ClienteUpdate, ClienteResponse, ClienteListResponse, ClientePaginado,
    ClientePreferenciaUpdate, ClientePreferenciaResponse,
    ClienteEtiquetaCreate, ClienteEtiquetaUpdate, ClienteEtiquetaResponse,
    AsignarEtiquetasRequest
)
from ..services.cliente_service import ClienteService
from ..dependencies import require_permission

router = APIRouter(
    prefix="/api/clientes",
    tags=["Clientes"]
)

etiquetas_router = APIRouter(
    prefix="/api/clientes/etiquetas",
    tags=["Etiquetas de Clientes"]
)


# ============================================
# ENDPOINTS CRUD DE CLIENTES
# ============================================

@router.get("", response_model=ClientePaginado)
def listar_clientes(
    query: Optional[str] = Query(None, description="Búsqueda por nombre, teléfono o email"),
    estado: Optional[str] = Query('activo', pattern='^(activo|inactivo|todos)$'),
    etiqueta_id: Optional[int] = Query(None, description="Filtrar por etiqueta"),
    min_visitas: Optional[int] = Query(None, ge=0),
    max_visitas: Optional[int] = Query(None, ge=0),
    pagina: int = Query(1, ge=1, description="Número de página"),
    por_pagina: int = Query(20, ge=1, le=100, description="Items por página"),
    ordenar_por: str = Query('nombre', description="Campo para ordenar"),
    orden: str = Query('asc', pattern='^(asc|desc)$'),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("clientes.ver"))
):
    """
    BE-CLI-001: Listar clientes con filtros y paginación
    Permiso: clientes.ver
    
    Retorna lista paginada de clientes con:
    - Búsqueda por texto (nombre, teléfono, email)
    - Filtros por estado, etiqueta, visitas
    - Ordenamiento configurable
    - Paginación
    """
    return ClienteService.get_all_paginado(
        db=db,
        sede_id=user["user"].sede_id,
        query=query,
        estado=estado,
        etiqueta_id=etiqueta_id,
        min_visitas=min_visitas,
        max_visitas=max_visitas,
        pagina=pagina,
        por_pagina=por_pagina,
        ordenar_por=ordenar_por,
        orden=orden
    )


@router.get("/activos", response_model=List[ClienteListResponse])
def listar_clientes_activos(
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("agenda.ver"))
):
    """
    BE-CLI-007: Listar clientes activos (para selectores)
    Permiso: agenda.ver
    """
    clientes = ClienteService.get_activos(db, user["user"].sede_id)
    result = []
    for cliente in clientes:
        etiquetas = ClienteService._get_etiquetas_cliente(db, cliente.id)
        result.append({
            "id": cliente.id,
            "nombre": cliente.nombre,
            "apellido": cliente.apellido,
            "cedula": cliente.cedula,
            "telefono": cliente.telefono,
            "email": cliente.email,
            "total_visitas": cliente.total_visitas or 0,
            "ultima_visita": cliente.ultima_visita,
            "etiquetas": etiquetas,
            "estado": cliente.estado
        })
    return result


@router.get("/buscar/rapida", response_model=List[ClienteListResponse])
def busqueda_rapida(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("clientes.buscar"))
):
    """
    BE-CLI-006: Búsqueda rápida de clientes
    Permiso: clientes.buscar
    
    Búsqueda rápida para autocompletado.
    Busca en nombre, apellido, teléfono y cédula.
    Retorna máximo 10 resultados por defecto.
    """
    clientes = ClienteService.busqueda_rapida(db, user["user"].sede_id, q, limite)
    result = []
    for cliente in clientes:
        etiquetas = ClienteService._get_etiquetas_cliente(db, cliente.id)
        result.append({
            "id": cliente.id,
            "nombre": cliente.nombre,
            "apellido": cliente.apellido,
            "cedula": cliente.cedula,
            "telefono": cliente.telefono,
            "email": cliente.email,
            "total_visitas": cliente.total_visitas or 0,
            "ultima_visita": cliente.ultima_visita,
            "etiquetas": etiquetas,
            "estado": cliente.estado
        })
    return result


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obtener_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.ver"))
):
    """
    BE-CLI-002: Obtener cliente por ID
    Permiso: clientes.ver
    
    Retorna información completa del cliente incluyendo:
    - Datos personales
    - Estadísticas
    - Etiquetas asignadas
    """
    cliente = ClienteService.get_by_id_completo(db, cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con ID {cliente_id} no encontrado"
        )
    return cliente


@router.post("", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def crear_cliente(
    cliente_data: ClienteCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("clientes.crear"))
):
    """
    BE-CLI-003: Crear nuevo cliente
    Permiso: clientes.crear
    
    Crea un nuevo cliente validando:
    - Email único (si se proporciona)
    - Teléfono único (si se proporciona)
    - Formato de teléfono
    - Datos obligatorios
    
    Automáticamente:
    - Establece estado 'activo'
    - Crea registro de preferencias vacío
    """
    cliente = ClienteService.create(db, cliente_data, user["user"].sede_id)
    return ClienteService.get_by_id_completo(db, cliente.id)


@router.put("/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(
    cliente_id: int,
    cliente_data: ClienteUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.editar"))
):
    """
    BE-CLI-004: Actualizar cliente
    Permiso: clientes.editar
    
    Actualiza campos del cliente.
    Solo los campos enviados serán actualizados.
    """
    ClienteService.update(db, cliente_id, cliente_data)
    return ClienteService.get_by_id_completo(db, cliente_id)


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.eliminar"))
):
    """
    BE-CLI-005: Desactivar cliente (soft delete)
    Permiso: clientes.eliminar
    
    Desactiva un cliente (no lo elimina físicamente).
    El cliente no aparecerá en listados por defecto.
    """
    ClienteService.delete(db, cliente_id)
    return None


@router.post("/{cliente_id}/reactivar", response_model=ClienteResponse)
def reactivar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.editar"))
):
    """
    BE-CLI-008: Reactivar cliente
    Permiso: clientes.editar
    
    Reactiva un cliente previamente desactivado.
    """
    ClienteService.reactivar(db, cliente_id)
    return ClienteService.get_by_id_completo(db, cliente_id)


# ============================================
# ENDPOINTS DE PREFERENCIAS
# ============================================

@router.get("/{cliente_id}/preferencias", response_model=ClientePreferenciaResponse)
def obtener_preferencias(
    cliente_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.ver"))
):
    """
    BE-CLIPREF-001: Obtener preferencias del cliente
    Permiso: clientes.ver
    
    Retorna preferencias del cliente incluyendo:
    - Productos favoritos
    - Alergias y condiciones
    - Notas de servicio
    """
    return ClienteService.get_preferencias(db, cliente_id)


@router.put("/{cliente_id}/preferencias", response_model=ClientePreferenciaResponse)
def actualizar_preferencias(
    cliente_id: int,
    preferencias_data: ClientePreferenciaUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.editar"))
):
    """
    BE-CLIPREF-002: Actualizar preferencias del cliente
    Permiso: clientes.editar
    
    Actualiza preferencias del cliente.
    Crea el registro si no existe.
    """
    return ClienteService.update_preferencias(db, cliente_id, preferencias_data)


# ============================================
# ENDPOINTS DE ETIQUETAS
# ============================================

@etiquetas_router.get("")
def listar_etiquetas(
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.ver"))
):
    """
    BE-ETIQ-001: Listar todas las etiquetas
    Permiso: clientes.ver
    
    Retorna todas las etiquetas con el total de clientes asociados.
    """
    try:
        result = ClienteService.get_all_etiquetas(db, True)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@etiquetas_router.post("", response_model=ClienteEtiquetaResponse, status_code=status.HTTP_201_CREATED)
def crear_etiqueta(
    etiqueta_data: ClienteEtiquetaCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.crear"))
):
    """
    BE-ETIQ-002: Crear nueva etiqueta
    Permiso: clientes.crear
    
    Crea una nueva etiqueta validando:
    - Nombre único
    - Color en formato HEX válido
    """
    etiqueta = ClienteService.create_etiqueta(db, etiqueta_data)
    return {
        "id": etiqueta.id,
        "nombre": etiqueta.nombre,
        "color": etiqueta.color,
        "fecha_creacion": etiqueta.fecha_creacion,
        "total_clientes": 0
    }


@etiquetas_router.put("/{etiqueta_id}", response_model=ClienteEtiquetaResponse)
def actualizar_etiqueta(
    etiqueta_id: int,
    etiqueta_data: ClienteEtiquetaUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.editar"))
):
    """
    BE-ETIQ-003: Actualizar etiqueta
    Permiso: clientes.editar
    """
    etiqueta = ClienteService.update_etiqueta(db, etiqueta_id, etiqueta_data)
    total = db.query(ClienteEtiquetaAsignacion).filter(
        ClienteEtiquetaAsignacion.etiqueta_id == etiqueta_id
    ).count()
    return {
        "id": etiqueta.id,
        "nombre": etiqueta.nombre,
        "color": etiqueta.color,
        "fecha_creacion": etiqueta.fecha_creacion,
        "total_clientes": total
    }


@etiquetas_router.delete("/{etiqueta_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_etiqueta(
    etiqueta_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.eliminar"))
):
    """
    BE-ETIQ-004: Eliminar etiqueta
    Permiso: clientes.eliminar
    
    Elimina una etiqueta.
    Se eliminan automáticamente todas las asociaciones con clientes.
    """
    ClienteService.delete_etiqueta(db, etiqueta_id)
    return None


# ============================================
# ENDPOINTS DE ASIGNACIÓN DE ETIQUETAS A CLIENTES
# ============================================

@router.post("/{cliente_id}/etiquetas", response_model=ClienteResponse)
def asignar_etiquetas(
    cliente_id: int,
    request: AsignarEtiquetasRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.editar"))
):
    """
    BE-CLI-ETIQ-001: Asignar etiquetas a cliente
    Permiso: clientes.editar
    
    Asigna una o varias etiquetas a un cliente.
    Si alguna etiqueta ya estaba asignada, se ignora.
    """
    ClienteService.asignar_etiquetas(db, cliente_id, request.etiqueta_ids)
    return ClienteService.get_by_id_completo(db, cliente_id)


@router.delete("/{cliente_id}/etiquetas/{etiqueta_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_etiqueta(
    cliente_id: int,
    etiqueta_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("clientes.editar"))
):
    """
    BE-CLI-ETIQ-002: Remover etiqueta de cliente
    Permiso: clientes.editar
    
    Elimina la asociación de una etiqueta con un cliente.
    """
    ClienteService.remover_etiqueta(db, cliente_id, etiqueta_id)
    return None


# Importar ClienteEtiquetaAsignacion para el conteo en actualizar_etiqueta
from ..models.cliente import ClienteEtiquetaAsignacion
