from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..dependencies import require_permission, get_current_user
from ..schemas.descuento import DescuentoCreate, DescuentoUpdate, DescuentoResponse
from ..services.descuento_service import DescuentoService
from ..models.user import Usuario

router = APIRouter(
    prefix="/api/descuentos",
    tags=["Descuentos"]
)

@router.get("", response_model=List[DescuentoResponse])
def listar_descuentos(
    skip: int = 0,
    limit: int = 100,
    activo: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user_data: dict = Depends(require_permission("descuentos.ver"))
):
    """
    Listar descuentos (Admin)
    """
    return DescuentoService.get_all(db, skip, limit, activo, search)

@router.get("/activos", response_model=List[DescuentoResponse])
def listar_descuentos_activos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Listar descuentos activos (Para uso en Caja/POS)
    Accesible para cualquier usuario autenticado (o restringir a cajeros/admins)
    """
    # Se filtra por la sede del usuario si tiene una asignada
    sede_id = current_user.sede_id
    return DescuentoService.get_validos(db, sede_id)

@router.post("", response_model=DescuentoResponse, status_code=status.HTTP_201_CREATED)
def crear_descuento(
    descuento: DescuentoCreate,
    db: Session = Depends(get_db),
    user_data: dict = Depends(require_permission("descuentos.crear"))
):
    return DescuentoService.create(db, descuento)

@router.put("/{descuento_id}", response_model=DescuentoResponse)
def actualizar_descuento(
    descuento_id: int,
    descuento: DescuentoUpdate,
    db: Session = Depends(get_db),
    user_data: dict = Depends(require_permission("descuentos.editar"))
):
    return DescuentoService.update(db, descuento_id, descuento)

@router.delete("/{descuento_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_descuento(
    descuento_id: int,
    db: Session = Depends(get_db),
    user_data: dict = Depends(require_permission("descuentos.eliminar"))
):
    DescuentoService.delete(db, descuento_id)
