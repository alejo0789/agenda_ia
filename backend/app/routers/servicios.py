from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..schemas.servicio import (
    CategoriaServicioCreate, CategoriaServicioUpdate, CategoriaServicioResponse, CategoriaOrdenUpdate,
    ServicioCreate, ServicioUpdate, ServicioResponse, ServicioConCategoriaResponse, ServicioPorCategoriaResponse
)
from ..services.categoria_servicio_service import CategoriaServicioService
from ..services.servicio_service import ServicioService
from ..dependencies import require_permission


# ============================================
# ROUTER DE CATEGORÍAS DE SERVICIO
# ============================================

categorias_router = APIRouter(
    prefix="/api/categorias-servicio",
    tags=["Categorías de Servicio"]
)


@categorias_router.get("", response_model=List[CategoriaServicioResponse])
def listar_categorias(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("servicios.ver"))
):
    """
    BE-CATSER-001: Listar categorías de servicio
    Permiso: servicios.ver
    """
    return CategoriaServicioService.get_all(db, skip, limit)


@categorias_router.get("/{id}", response_model=CategoriaServicioResponse)
def obtener_categoria(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("servicios.ver"))
):
    """
    BE-CATSER-002: Obtener categoría por ID
    Permiso: servicios.ver
    """
    categoria = CategoriaServicioService.get_by_id(db, id)
    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )
    return categoria


@categorias_router.post("", response_model=CategoriaServicioResponse, status_code=status.HTTP_201_CREATED)
def crear_categoria(
    categoria: CategoriaServicioCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("servicios.crear"))
):
    """
    BE-CATSER-003: Crear categoría
    Permiso: servicios.crear
    """
    return CategoriaServicioService.create(db, categoria)


@categorias_router.put("/{id}", response_model=CategoriaServicioResponse)
def actualizar_categoria(
    id: int,
    categoria: CategoriaServicioUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("servicios.editar"))
):
    """
    BE-CATSER-004: Actualizar categoría
    Permiso: servicios.editar
    """
    return CategoriaServicioService.update(db, id, categoria)


@categorias_router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_categoria(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("servicios.eliminar"))
):
    """
    BE-CATSER-005: Eliminar categoría
    Permiso: servicios.eliminar
    
    RN-SER-005: No eliminar categoría con servicios asociados
    """
    CategoriaServicioService.delete(db, id)
    return None


@categorias_router.put("/orden", response_model=List[CategoriaServicioResponse])
def reordenar_categorias(
    orden: CategoriaOrdenUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("servicios.editar"))
):
    """
    BE-CATSER-006: Reordenar categorías
    Permiso: servicios.editar
    """
    return CategoriaServicioService.reordenar(db, orden.categorias)


# ============================================
# ROUTER DE SERVICIOS
# ============================================

servicios_router = APIRouter(
    prefix="/api/servicios",
    tags=["Servicios"]
)


@servicios_router.get("", response_model=List[ServicioConCategoriaResponse])
def listar_servicios(
    skip: int = 0,
    limit: int = 100,
    categoria_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("servicios.ver"))
):
    """
    BE-SER-001: Listar servicios
    Permiso: servicios.ver
    
    Parámetros opcionales:
    - categoria_id: Filtrar por categoría
    - estado: Filtrar por estado (activo/inactivo)
    """
    return ServicioService.get_all(db, user["user"].sede_id, skip, limit, categoria_id, estado)


@servicios_router.get("/activos", response_model=List[ServicioPorCategoriaResponse])
def listar_servicios_activos(
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("agenda.ver"))
):
    """
    BE-SER-006: Servicios activos agrupados por categoría
    Permiso: agenda.ver
    
    Retorna los servicios activos organizados por categoría para
    facilitar la selección en el agendamiento de citas.
    """
    return ServicioService.get_activos_por_categoria(db, user["user"].sede_id)


@servicios_router.get("/{id}", response_model=ServicioConCategoriaResponse)
def obtener_servicio(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("servicios.ver"))
):
    """
    BE-SER-002: Obtener servicio por ID
    Permiso: servicios.ver
    """
    servicio = ServicioService.get_by_id(db, id)
    if not servicio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    return servicio


@servicios_router.post("", response_model=ServicioResponse, status_code=status.HTTP_201_CREATED)
def crear_servicio(
    servicio: ServicioCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("servicios.crear"))
):
    """
    BE-SER-003: Crear servicio
    Permiso: servicios.crear
    
    Reglas de negocio aplicadas:
    - RN-SER-001: Duración mínima 15 minutos
    - RN-SER-002: Duración múltiplo de 15
    - RN-SER-003: Precio >= 0
    - RN-SER-004: Color HEX válido (#RRGGBB)
    """
    return ServicioService.create(db, servicio)


@servicios_router.put("/{id}", response_model=ServicioResponse)
def actualizar_servicio(
    id: int,
    servicio: ServicioUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("servicios.editar"))
):
    """
    BE-SER-004: Actualizar servicio
    Permiso: servicios.editar
    """
    return ServicioService.update(db, id, servicio)


@servicios_router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_servicio(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("servicios.eliminar"))
):
    """
    BE-SER-005: Desactivar servicio (soft delete)
    Permiso: servicios.eliminar
    
    RN-SER-006: No desactivar servicio con citas futuras (pendiente implementar)
    """
    ServicioService.delete(db, id)
    return None


@servicios_router.put("/{id}/activar", response_model=ServicioResponse)
def activar_servicio(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("servicios.editar"))
):
    """
    Reactivar un servicio previamente desactivado
    Permiso: servicios.editar
    """
    return ServicioService.activar(db, id)
