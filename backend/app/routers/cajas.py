"""
Router para gestión de Cajas

Endpoints:
- GET /api/cajas/actual - Caja abierta actual
- POST /api/cajas/apertura - Abrir caja
- POST /api/cajas/{id}/cierre - Cerrar caja
- GET /api/cajas/{id} - Detalle de caja
- GET /api/cajas - Listar cajas
- GET /api/cajas/{id}/cuadre - Cuadre de caja
- GET /api/cajas/{id}/movimientos - Movimientos de caja
- POST /api/cajas/{id}/movimientos - Registrar movimiento
- GET /api/cajas/{id}/movimientos/resumen - Resumen movimientos
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from ..database import get_db
from ..schemas.caja import (
    CajaAperturaCreate, CajaCierreCreate, CajaDetalle, CajaList,
    CajaCuadre, CajasPaginadas, MovimientoCajaCreate, MovimientoCajaResponse
)
from ..services.caja_service import CajaService
from ..services.movimiento_caja_service import MovimientoCajaService
from ..dependencies import require_permission

router = APIRouter(
    prefix="/api/cajas",
    tags=["Cajas"]
)


@router.get("/actual")
def obtener_caja_actual(
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.ver"))
):
    """BE-CAJA-001: Obtener caja abierta actual"""
    caja = CajaService.obtener_caja_actual(db, user["user"].sede_id)
    if not caja:
        return {"message": "No hay caja abierta", "caja": None}
    return {"caja": CajaService.get_detalle(db, caja.id)}


@router.post("/apertura", status_code=status.HTTP_201_CREATED)
def abrir_caja(
    data: CajaAperturaCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.apertura"))
):
    """BE-CAJA-002: Abrir nueva caja"""
    caja = CajaService.abrir_caja(db, data, user["user"].id, user["user"].sede_id)
    return CajaService.get_detalle(db, caja.id)


@router.post("/{caja_id}/cierre")
def cerrar_caja(
    caja_id: int,
    data: CajaCierreCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.cierre"))
):
    """BE-CAJA-003: Cerrar caja"""
    CajaService.cerrar_caja(db, caja_id, data, user["user"].id)
    return CajaService.get_detalle(db, caja_id)


@router.get("/{caja_id}")
def obtener_caja(
    caja_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("caja.ver"))
):
    """BE-CAJA-004: Detalle de caja específica"""
    detalle = CajaService.get_detalle(db, caja_id)
    if not detalle:
        raise HTTPException(status_code=404, detail="Caja no encontrada")
    return detalle


@router.get("", response_model=CajasPaginadas)
def listar_cajas(
    estado: Optional[str] = Query(None, regex='^(abierta|cerrada|todos)$'),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.ver"))
):
    """BE-CAJA-005: Listar todas las cajas"""
    return CajaService.get_all_paginado(db, user["user"].sede_id, estado, pagina, por_pagina)


@router.get("/{caja_id}/cuadre")
def obtener_cuadre(
    caja_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("caja.ver"))
):
    """BE-CAJA-006: Reporte de cuadre de caja"""
    return CajaService.calcular_cuadre(db, caja_id)


# Movimientos de caja
@router.get("/{caja_id}/movimientos")
def listar_movimientos(
    caja_id: int,
    tipo: Optional[str] = Query(None, regex='^(ingreso|egreso|todos)$'),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("caja.ver"))
):
    """BE-MOV-001: Listar movimientos de una caja"""
    return MovimientoCajaService.get_movimientos_con_usuario(db, caja_id)


@router.post("/{caja_id}/movimientos", status_code=status.HTTP_201_CREATED)
def registrar_movimiento(
    caja_id: int,
    data: MovimientoCajaCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.ver"))
):
    """BE-MOV-002: Registrar ingreso/egreso"""
    mov = MovimientoCajaService.registrar_movimiento(db, caja_id, data, user["user"].id)
    return {
        "id": mov.id,
        "caja_id": mov.caja_id,
        "tipo": mov.tipo,
        "monto": mov.monto,
        "concepto": mov.concepto,
        "fecha": mov.fecha
    }



@router.get("/{caja_id}/movimientos/resumen")
def resumen_movimientos(
    caja_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("caja.ver"))
):
    """BE-MOV-003: Resumen de movimientos"""
    return MovimientoCajaService.get_resumen(db, caja_id)
