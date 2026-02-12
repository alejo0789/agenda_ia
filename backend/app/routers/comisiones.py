"""
Router para consulta de Comisiones

Endpoints:
- GET /api/comisiones/factura/{factura_id} - Comisiones de una factura
- GET /api/comisiones/especialista/{especialista_id} - Comisiones por período
- GET /api/comisiones/resumen - Resumen de comisiones general
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, timedelta

from ..database import get_db
from ..services.comision_service import ComisionService
from ..dependencies import require_permission, get_current_user
from ..services.permission_service import PermissionService

router = APIRouter(
    prefix="/api/comisiones",
    tags=["Comisiones"]
)


@router.get("/factura/{factura_id}")
def comisiones_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("caja.ver"))
):
    """Obtener comisiones de una factura"""
    from ..models.caja import Factura
    
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    
    comisiones = ComisionService.calcular_comisiones_factura(db, factura_id)
    resumen = ComisionService.get_resumen_comisiones_por_especialista(db, factura_id)
    
    # Serializar Decimal a float para JSON
    for c in comisiones:
        c['monto_comision'] = float(c['monto_comision'])
        c['valor_comision'] = float(c['valor_comision'])
        if c.get('subtotal_linea'):
            c['subtotal_linea'] = float(c['subtotal_linea'])
    
    for esp_id, data in resumen.items():
        data['total_comision'] = float(data['total_comision'])
        for d in data['detalle']:
            d['monto_comision'] = float(d['monto_comision'])
            d['valor_comision'] = float(d['valor_comision'])
    
    return {
        'factura_id': factura_id,
        'numero_factura': factura.numero_factura,
        'total_factura': float(factura.total),
        'comisiones': comisiones,
        'resumen_por_especialista': list(resumen.values())
    }


@router.get("/especialista/{especialista_id}")
def comisiones_especialista(
    especialista_id: int,
    fecha_desde: Optional[date] = Query(None, description="Fecha inicio (default: inicio del mes)"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha fin (default: hoy)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener comisiones de un especialista por período.
    
    Permite acceso si:
    1. El usuario tiene permiso 'caja.ver' (Admin/Cajero)
    2. El usuario es el mismo especialista que consulta
    """
    from ..models.especialista import Especialista
    from ..services.permission_service import PermissionService

    # Verificar permisos
    has_permission = PermissionService.user_has_permission(db, current_user.id, "caja.ver")
    is_own_profile = current_user.especialista_id == especialista_id
    
    if not has_permission and not is_own_profile:
        raise HTTPException(
            status_code=403,
            detail="No tiene permiso para ver comisiones de otro especialista"
        )
    from ..models.especialista import Especialista
    
    especialista = db.query(Especialista).filter(Especialista.id == especialista_id).first()
    if not especialista:
        raise HTTPException(status_code=404, detail="Especialista no encontrado")
    
    # Valores por defecto: mes actual
    if not fecha_hasta:
        fecha_hasta = date.today()
    if not fecha_desde:
        fecha_desde = fecha_hasta.replace(day=1)
    
    comisiones = ComisionService.get_comisiones_periodo(
        db, especialista_id, fecha_desde, fecha_hasta
    )
    
    # Serializar Decimal a float
    comisiones['total_servicios'] = float(comisiones['total_servicios'])
    comisiones['total_productos'] = float(comisiones['total_productos'])
    comisiones['total_comision'] = float(comisiones['total_comision'])
    
    for d in comisiones['detalle']:
        d['monto_comision'] = float(d['monto_comision'])
        d['valor_comision'] = float(d['valor_comision'])
        if d.get('subtotal_linea'):
            d['subtotal_linea'] = float(d['subtotal_linea'])
    
    return {
        'especialista': {
            'id': especialista.id,
            'nombre': f"{especialista.nombre} {especialista.apellido}".strip()
        },
        **comisiones
    }


@router.get("/resumen")
def resumen_comisiones(
    fecha_desde: Optional[date] = Query(None, description="Fecha inicio (default: inicio del mes)"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha fin (default: hoy)"),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("caja.ver"))
):
    """
    Obtener resumen de comisiones de todos los especialistas.
    
    Por defecto retorna comisiones del mes actual.
    """
    from ..models.especialista import Especialista
    
    # Valores por defecto: mes actual
    if not fecha_hasta:
        fecha_hasta = date.today()
    if not fecha_desde:
        fecha_desde = fecha_hasta.replace(day=1)
    
    # Obtener especialistas activos
    especialistas = db.query(Especialista).filter(
        Especialista.estado == 'activo'
    ).all()
    
    resumen = []
    total_general = 0.0
    
    for esp in especialistas:
        comisiones = ComisionService.get_comisiones_periodo(
            db, esp.id, fecha_desde, fecha_hasta
        )
        
        total_esp = float(comisiones['total_comision'])
        total_general += total_esp
        
        resumen.append({
            'especialista_id': esp.id,
            'especialista_nombre': f"{esp.nombre} {esp.apellido}".strip(),
            'total_servicios': float(comisiones['total_servicios']),
            'total_productos': float(comisiones['total_productos']),
            'total_comision': total_esp,
            'cantidad_items': comisiones['cantidad_items']
        })
    
    # Ordenar por total de comisión descendente
    resumen.sort(key=lambda x: x['total_comision'], reverse=True)
    
    return {
        'fecha_desde': fecha_desde,
        'fecha_hasta': fecha_hasta,
        'total_general': total_general,
        'cantidad_especialistas': len([r for r in resumen if r['cantidad_items'] > 0]),
        'detalle_por_especialista': resumen
    }
