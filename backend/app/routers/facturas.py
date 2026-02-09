"""
Router para gestión de Facturas

Endpoints:
- GET /api/facturas - Listar facturas
- GET /api/facturas/{id} - Detalle de factura
- POST /api/facturas - Crear factura (flujo directo)
- POST /api/facturas/orden - Crear orden pendiente (Especialistas)
- POST /api/facturas/desde-pendientes - Crear desde pendientes
- PUT /api/facturas/{id}/anular - Anular factura
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from ..database import get_db
from ..schemas.caja import (
    FacturaCreate, FacturaFromPendientesCreate, FacturaResponse,
    FacturasPaginadas, FacturaAnular, FacturaUpdate, FacturaOrdenCreate
)
from ..services.factura_service import FacturaService
from ..dependencies import require_permission

router = APIRouter(
    prefix="/api/facturas",
    tags=["Facturas"]
)


@router.get("", response_model=FacturasPaginadas)
def listar_facturas(
    estado: Optional[str] = Query(None, pattern='^(pendiente|pagada|anulada|todos)$'),
    caja_id: Optional[int] = Query(None),
    cliente_id: Optional[int] = Query(None),
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.ver"))
):
    """BE-FAC-001: Listar facturas con filtros"""
    result = FacturaService.get_all_paginado(
        db=db,
        sede_id=user["user"].sede_id,
        estado=estado,
        caja_id=caja_id,
        cliente_id=cliente_id,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        pagina=pagina,
        por_pagina=por_pagina
    )
    
    # Formatear items para respuesta
    items = []
    for f in result['items']:
        cliente_nombre = None
        if f.cliente:
            cliente_nombre = f"{f.cliente.nombre} {f.cliente.apellido or ''}".strip()
        
        total_pagado = sum(p.monto for p in f.pagos) if f.pagos else 0
        
        items.append({
            'id': f.id,
            'numero_factura': f.numero_factura,
            'cliente_nombre': cliente_nombre,
            'fecha': f.fecha,
            'total': f.total,
            'estado': f.estado,
            'total_pagado': total_pagado
        })
    
    return {
        'total': result['total'],
        'pagina': result['pagina'],
        'por_pagina': result['por_pagina'],
        'total_paginas': result['total_paginas'],
        'items': items
    }


@router.get("/{factura_id}")
def obtener_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("caja.ver"))
):
    """BE-FAC-002: Detalle de factura"""
    detalle = FacturaService.get_detalle_completo(db, factura_id)
    if not detalle:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return detalle


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_factura(
    data: FacturaCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.facturar"))
):
    """BE-FAC-003: Crear factura (flujo directo)"""
    import logging
    logging.info(f"Creando factura con datos: {data}")
    try:
        factura = FacturaService.crear_factura(db, data, user["user"].id, user["user"].sede_id)
        return FacturaService.get_detalle_completo(db, factura.id)
    except Exception as e:
        logging.error(f"Error creando factura: {e}")
        raise


@router.post("/orden", status_code=status.HTTP_201_CREATED)
def crear_orden_pendiente(
    data: FacturaOrdenCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission(["caja.crear_orden", "caja.facturar"]))
):
    """
    BE-FAC-007: Crear orden pendiente (Especialistas)
    
    Permite a los especialistas registrar servicios/productos 
    que luego serán cobrados por caja.
    """
    # Convert FacturaOrdenCreate to FacturaCreate (with empty payments)
    factura_data = FacturaCreate(
        cliente_id=data.cliente_id,
        detalle=data.detalle,
        pagos=[],
        abonos_aplicar=[],
        descuento=0, # Especialistas no aplican descuento general
        notas=data.notas,
        facturas_pendientes_ids=data.facturas_pendientes_ids,
        factura_id_remplazar=data.factura_id_remplazar
    )
    
    factura = FacturaService.crear_orden_pendiente(db, factura_data, user["user"].id, user["user"].sede_id)
    return FacturaService.get_detalle_completo(db, factura.id)


@router.post("/desde-pendientes", status_code=status.HTTP_201_CREATED)
def crear_desde_pendientes(
    data: FacturaFromPendientesCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.facturar"))
):
    """BE-FAC-004: Crear factura desde pendientes"""
    factura = FacturaService.crear_factura_desde_pendientes(db, data, user["user"].id)
    return FacturaService.get_detalle_completo(db, factura.id)


@router.put("/{factura_id}/anular")
def anular_factura(
    factura_id: int,
    data: FacturaAnular,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.anular"))
):
    """BE-FAC-005: Anular factura"""
    factura = FacturaService.anular_factura(db, factura_id, data.motivo, user["user"].id)
    return FacturaService.get_detalle_completo(db, factura.id)


@router.put("/{factura_id}")
def actualizar_factura(
    factura_id: int,
    data: FacturaUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("caja.anular")) # Usamos permiso alto nivel
):
    """BE-FAC-006: Actualizar factura (Solo Admin)"""
    # Verificar que sea admin o tenga permisos elevados
    # (Por ahora confiamos en caja.anular que es sensitivo)
    factura = FacturaService.actualizar_factura(db, factura_id, data, user["user"].id)
    return FacturaService.get_detalle_completo(db, factura.id)
