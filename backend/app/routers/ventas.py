"""
Router para Ventas y Métodos de Pago

Endpoints:
- GET /api/ventas/dia - Ventas del día
- GET /api/ventas/periodo - Ventas por período
- GET /api/ventas/metodos-pago - Resumen por método de pago
- GET /api/metodos-pago - Listar métodos de pago
- PUT /api/metodos-pago/{id} - Activar/desactivar método
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from ..database import get_db
from ..schemas.caja import (
    VentasDiaResponse, VentasResumenResponse,
    MetodoPagoResponse, MetodoPagoUpdate
)
from ..services.ventas_service import VentasService
from ..models.caja import MetodoPago
from ..dependencies import require_permission

ventas_router = APIRouter(
    prefix="/api/ventas",
    tags=["Ventas"]
)

metodos_router = APIRouter(
    prefix="/api/metodos-pago",
    tags=["Métodos de Pago"]
)


# Ventas
@ventas_router.get("/dia")
def ventas_dia(
    fecha: Optional[date] = Query(None, description="Fecha (default: hoy)"),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.ver"))
):
    """BE-VTAS-001: Ventas del día actual"""
    return VentasService.ventas_dia(db, user["user"].sede_id, fecha)


@ventas_router.get("/periodo")
def ventas_periodo(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.ver"))
):
    """BE-VTAS-002: Ventas por período"""
    return VentasService.ventas_periodo(db, user["user"].sede_id, fecha_inicio, fecha_fin)


@ventas_router.get("/metodos-pago")
def ventas_metodos_pago(
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.ver"))
):
    """BE-VTAS-003: Resumen por método de pago"""
    return VentasService.ventas_por_metodo_pago(db, user["user"].sede_id, fecha_inicio, fecha_fin)


# Métodos de Pago
@metodos_router.get("")
def listar_metodos(
    solo_activos: bool = Query(True),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("caja.ver"))
):
    """BE-MPAGO-001: Listar métodos de pago"""
    query = db.query(MetodoPago)
    if solo_activos:
        query = query.filter(MetodoPago.activo == True)
    metodos = query.order_by(MetodoPago.nombre).all()
    return [{
        'id': m.id,
        'nombre': m.nombre,
        'activo': bool(m.activo),
        'requiere_referencia': bool(m.requiere_referencia)
    } for m in metodos]


@metodos_router.put("/{metodo_id}")
def actualizar_metodo(
    metodo_id: int,
    data: MetodoPagoUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("config.editar"))
):
    """BE-MPAGO-002: Activar/desactivar método"""
    metodo = db.query(MetodoPago).filter(MetodoPago.id == metodo_id).first()
    if not metodo:
        raise HTTPException(status_code=404, detail="Método de pago no encontrado")
    
    if data.activo is not None:
        metodo.activo = data.activo
    
    db.commit()
    db.refresh(metodo)
    
    return {
        'id': metodo.id,
        'nombre': metodo.nombre,
        'activo': bool(metodo.activo),
        'requiere_referencia': bool(metodo.requiere_referencia)
    }
