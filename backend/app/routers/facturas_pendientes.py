"""
Router para Facturas Pendientes

Endpoints:
- GET /api/facturas-pendientes - Listar pendientes
- GET /api/facturas-pendientes/resumen-por-cliente - Resumen por cliente
- GET /api/facturas-pendientes/{id} - Detalle de pendiente
- POST /api/facturas-pendientes/{id}/aprobar - Aprobar
- POST /api/facturas-pendientes/{id}/rechazar - Rechazar
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional, List

from ..database import get_db
from ..schemas.caja import (
    FacturaPendienteCreate, FacturaPendienteResponse,
    FacturaPendienteRechazar, FacturaPendienteResumen
)
from ..services.factura_pendiente_service import FacturaPendienteService
from ..dependencies import require_permission

router = APIRouter(
    prefix="/api/facturas-pendientes",
    tags=["Facturas Pendientes"]
)


@router.get("")
def listar_pendientes(
    estado: Optional[str] = Query('pendiente', pattern='^(pendiente|aprobada|rechazada|todos)$'),
    especialista_id: Optional[int] = Query(None),
    cliente_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.aprobar_pendientes"))
):
    """BE-FACPEN-001: Listar pendientes con filtros"""
    pendientes = FacturaPendienteService.get_all(db, user["user"].sede_id, estado, especialista_id, cliente_id)
    result = []
    for p in pendientes:
        detalle = FacturaPendienteService.get_detalle_completo(db, p.id)
        if detalle:
            result.append(detalle)
    return result


@router.get("/resumen-por-cliente")
def resumen_por_cliente(
    cliente_id: Optional[int] = Query(None),
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.aprobar_pendientes"))
):
    """BE-FACPEN-002: Resumen agrupado por cliente"""
    return FacturaPendienteService.get_resumen_por_cliente(
        db, 
        user["user"].sede_id, 
        cliente_id,
        fecha_inicio,
        fecha_fin
    )


@router.get("/{pendiente_id}")
def obtener_pendiente(
    pendiente_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("caja.aprobar_pendientes"))
):
    """BE-FACPEN-003: Detalle de pendiente"""
    detalle = FacturaPendienteService.get_detalle_completo(db, pendiente_id)
    if not detalle:
        raise HTTPException(status_code=404, detail="Servicio pendiente no encontrado")
    return detalle


@router.post("/{pendiente_id}/aprobar")
def aprobar_pendiente(
    pendiente_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.aprobar_pendientes"))
):
    """BE-FACPEN-004: Aprobar servicio pendiente"""
    FacturaPendienteService.aprobar_pendiente(db, pendiente_id, user["user"].id)
    return FacturaPendienteService.get_detalle_completo(db, pendiente_id)


@router.post("/{pendiente_id}/rechazar")
def rechazar_pendiente(
    pendiente_id: int,
    data: FacturaPendienteRechazar,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.aprobar_pendientes"))
):
    """BE-FACPEN-005: Rechazar servicio pendiente"""
    FacturaPendienteService.rechazar_pendiente(db, pendiente_id, data.motivo_rechazo, user["user"].id)
    return FacturaPendienteService.get_detalle_completo(db, pendiente_id)
