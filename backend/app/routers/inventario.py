from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from datetime import date

from ..database import get_db
from ..dependencies import require_permission
from ..schemas.producto import (
    # Ubicación
    UbicacionCreate, UbicacionUpdate, UbicacionResponse,
    # Inventario
    InventarioResponse, AjusteInventarioRequest, TransferenciaRequest,
    ConteoFisicoRequest, ConteoFisicoResponse,
    # Movimientos
    MovimientoCreate, MovimientoResponse, MovimientoPaginado, CompraRequest,
    # Reportes
    ResumenInventarioResponse, VentaProductoReporte, ProductoPorEspecialistaReporte
)
from ..services.producto_service import UbicacionService, ProductoService
from ..services.inventario_service import InventarioService, MovimientoService


# ============================================
# ROUTER DE INVENTARIO
# ============================================

router = APIRouter(
    prefix="/api/inventario",
    tags=["Inventario"]
)


# ============================================
# ENDPOINTS DE UBICACIONES
# ============================================

@router.get("/ubicaciones", response_model=List[UbicacionResponse])
def listar_ubicaciones(
    tipo: Optional[str] = Query(None, description="Filtrar por tipo (bodega/vitrina/otro)"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("inventario.ver"))
):
    """
    FN-UBI-001: Listar ubicaciones de inventario.
    Permiso: inventario.ver
    """
    ubicaciones = UbicacionService.get_all(db, sede_id=user["user"].sede_id, tipo=tipo, estado=estado)
    
    result = []
    for ubicacion in ubicaciones:
        stats = UbicacionService.get_estadisticas(db, ubicacion.id)
        result.append(UbicacionResponse(
            id=ubicacion.id,
            nombre=ubicacion.nombre,
            tipo=ubicacion.tipo,
            descripcion=ubicacion.descripcion,
            es_principal=ubicacion.es_principal == 1,
            estado=ubicacion.estado,
            total_productos=stats['total_productos'],
            valor_total=stats['valor_total'],
            fecha_creacion=ubicacion.fecha_creacion
        ))
    
    return result


@router.get("/ubicaciones/{ubicacion_id}", response_model=UbicacionResponse)
def obtener_ubicacion(
    ubicacion_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("inventario.ver"))
):
    """
    FN-UBI-002: Obtener detalle de una ubicación.
    Permiso: inventario.ver
    """
    ubicacion = UbicacionService.get_by_id_or_404(db, ubicacion_id)
    stats = UbicacionService.get_estadisticas(db, ubicacion_id)
    
    return UbicacionResponse(
        id=ubicacion.id,
        nombre=ubicacion.nombre,
        tipo=ubicacion.tipo,
        descripcion=ubicacion.descripcion,
        es_principal=ubicacion.es_principal == 1,
        estado=ubicacion.estado,
        total_productos=stats['total_productos'],
        valor_total=stats['valor_total'],
        fecha_creacion=ubicacion.fecha_creacion
    )


@router.post("/ubicaciones", response_model=UbicacionResponse, status_code=status.HTTP_201_CREATED)
def crear_ubicacion(
    ubicacion_data: UbicacionCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("inventario.configurar"))
):
    """
    FN-UBI-003: Crear nueva ubicación.
    Permiso: inventario.configurar
    """
    ubicacion = UbicacionService.create(db, ubicacion_data, user["user"].sede_id)
    
    return UbicacionResponse(
        id=ubicacion.id,
        nombre=ubicacion.nombre,
        tipo=ubicacion.tipo,
        descripcion=ubicacion.descripcion,
        es_principal=ubicacion.es_principal == 1,
        estado=ubicacion.estado,
        total_productos=0,
        valor_total=Decimal("0"),
        fecha_creacion=ubicacion.fecha_creacion
    )


@router.put("/ubicaciones/{ubicacion_id}", response_model=UbicacionResponse)
def actualizar_ubicacion(
    ubicacion_id: int,
    ubicacion_data: UbicacionUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("inventario.configurar"))
):
    """
    FN-UBI-004: Actualizar ubicación.
    Permiso: inventario.configurar
    """
    ubicacion = UbicacionService.update(db, ubicacion_id, ubicacion_data)
    stats = UbicacionService.get_estadisticas(db, ubicacion_id)
    
    return UbicacionResponse(
        id=ubicacion.id,
        nombre=ubicacion.nombre,
        tipo=ubicacion.tipo,
        descripcion=ubicacion.descripcion,
        es_principal=ubicacion.es_principal == 1,
        estado=ubicacion.estado,
        total_productos=stats['total_productos'],
        valor_total=stats['valor_total'],
        fecha_creacion=ubicacion.fecha_creacion
    )


@router.get("/ubicaciones/{ubicacion_id}/productos")
def listar_productos_ubicacion(
    ubicacion_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("inventario.ver"))
):
    """
    FN-UBI-005: Listar productos con su stock en una ubicación.
    Permiso: inventario.ver
    """
    return UbicacionService.get_productos_ubicacion(db, ubicacion_id)


# ============================================
# ENDPOINTS DE INVENTARIO
# ============================================

@router.get("", response_model=List[InventarioResponse])
def listar_inventario(
    producto_id: Optional[int] = Query(None, description="Filtrar por producto"),
    ubicacion_id: Optional[int] = Query(None, description="Filtrar por ubicación"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("inventario.ver"))
):
    """
    FN-INV-001: Listar inventario completo.
    Permiso: inventario.ver
    """
    inventarios = InventarioService.get_all(
        db,
        sede_id=user["user"].sede_id,
        producto_id=producto_id,
        ubicacion_id=ubicacion_id,
        skip=skip,
        limit=limit
    )
    
    return [
        InventarioResponse(
            id=inv.id,
            producto_id=inv.producto.id,
            producto_nombre=inv.producto.nombre,
            producto_codigo=inv.producto.codigo,
            ubicacion_id=inv.ubicacion.id,
            ubicacion_nombre=inv.ubicacion.nombre,
            cantidad=inv.cantidad,
            precio_venta=inv.producto.precio_venta,
            valor_total=Decimal(str(inv.cantidad * float(inv.producto.precio_venta))),
            fecha_actualizacion=inv.fecha_actualizacion
        )
        for inv in inventarios
    ]


@router.post("/ajustar")
def ajustar_inventario(
    ajuste: AjusteInventarioRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("inventario.ajustar"))
):
    """
    FN-INV-002: Ajustar inventario manualmente.
    Permiso: inventario.ajustar
    
    Crea movimiento de ajuste_positivo o ajuste_negativo según la diferencia.
    """
    usuario_id = current_user["user"].id
    return InventarioService.ajustar_inventario(db, ajuste, usuario_id)


@router.post("/transferir")
def transferir_inventario(
    transferencia: TransferenciaRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("inventario.transferir"))
):
    """
    FN-INV-003: Transferir productos entre ubicaciones.
    Permiso: inventario.transferir
    
    RN-003: Transferencias manuales Bodega → Vitrina
    RN-008: Validación de stock
    """
    usuario_id = current_user["user"].id
    movimiento = InventarioService.transferir(db, transferencia, usuario_id)
    
    return {
        "mensaje": "Transferencia realizada correctamente",
        "movimiento_id": movimiento.id,
        "producto_id": movimiento.producto_id,
        "cantidad": movimiento.cantidad,
        "ubicacion_origen": movimiento.ubicacion_origen.nombre,
        "ubicacion_destino": movimiento.ubicacion_destino.nombre
    }


@router.post("/conteo-fisico", response_model=ConteoFisicoResponse)
def conteo_fisico(
    conteo: ConteoFisicoRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("inventario.ajustar"))
):
    """
    FN-INV-004: Registrar conteo físico masivo.
    Permiso: inventario.ajustar
    
    RN-011: Genera ajustes automáticos por diferencias.
    """
    usuario_id = current_user["user"].id
    return InventarioService.conteo_fisico(db, conteo, usuario_id)


# ============================================
# ENDPOINTS DE MOVIMIENTOS
# ============================================

@router.get("/movimientos", response_model=MovimientoPaginado)
def listar_movimientos(
    producto_id: Optional[int] = Query(None, description="Filtrar por producto"),
    tipo_movimiento: Optional[str] = Query(None, description="Filtrar por tipo"),
    ubicacion_origen_id: Optional[int] = Query(None, description="Filtrar por ubicación origen"),
    ubicacion_destino_id: Optional[int] = Query(None, description="Filtrar por ubicación destino"),
    usuario_id: Optional[int] = Query(None, description="Filtrar por usuario"),
    fecha_desde: Optional[date] = Query(None, description="Fecha desde"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha hasta"),
    referencia: Optional[str] = Query(None, description="Buscar por referencia"),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("inventario.ver"))
):
    """
    FN-MOV-001: Listar movimientos con filtros y paginación.
    Permiso: inventario.ver
    """
    movimientos, total = MovimientoService.get_all_paginado(
        db,
        sede_id=user["user"].sede_id,
        producto_id=producto_id,
        tipo_movimiento=tipo_movimiento,
        ubicacion_origen_id=ubicacion_origen_id,
        ubicacion_destino_id=ubicacion_destino_id,
        usuario_id=usuario_id,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        referencia=referencia,
        pagina=pagina,
        por_pagina=por_pagina
    )
    
    items = [
        MovimientoResponse(
            id=mov.id,
            producto_id=mov.producto.id,
            producto_nombre=mov.producto.nombre,
            producto_codigo=mov.producto.codigo,
            tipo_movimiento=mov.tipo_movimiento,
            cantidad=mov.cantidad,
            ubicacion_origen_id=mov.ubicacion_origen_id,
            ubicacion_origen_nombre=mov.ubicacion_origen.nombre if mov.ubicacion_origen else None,
            ubicacion_destino_id=mov.ubicacion_destino_id,
            ubicacion_destino_nombre=mov.ubicacion_destino.nombre if mov.ubicacion_destino else None,
            venta_id=mov.venta_id,
            costo_unitario=mov.costo_unitario,
            costo_total=mov.costo_total,
            motivo=mov.motivo,
            referencia=mov.referencia,
            usuario_id=mov.usuario_id,
            usuario_nombre=mov.usuario.username if mov.usuario else None,
            fecha_movimiento=mov.fecha_movimiento
        )
        for mov in movimientos
    ]
    
    total_paginas = (total + por_pagina - 1) // por_pagina
    
    return MovimientoPaginado(
        total=total,
        pagina=pagina,
        por_pagina=por_pagina,
        total_paginas=total_paginas,
        items=items
    )


@router.get("/movimientos/{movimiento_id}", response_model=MovimientoResponse)
def obtener_movimiento(
    movimiento_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("inventario.ver"))
):
    """
    FN-MOV-002: Obtener detalle de un movimiento.
    Permiso: inventario.ver
    """
    mov = MovimientoService.get_by_id_or_404(db, movimiento_id)
    
    return MovimientoResponse(
        id=mov.id,
        producto_id=mov.producto.id,
        producto_nombre=mov.producto.nombre,
        producto_codigo=mov.producto.codigo,
        tipo_movimiento=mov.tipo_movimiento,
        cantidad=mov.cantidad,
        ubicacion_origen_id=mov.ubicacion_origen_id,
        ubicacion_origen_nombre=mov.ubicacion_origen.nombre if mov.ubicacion_origen else None,
        ubicacion_destino_id=mov.ubicacion_destino_id,
        ubicacion_destino_nombre=mov.ubicacion_destino.nombre if mov.ubicacion_destino else None,
        venta_id=mov.venta_id,
        costo_unitario=mov.costo_unitario,
        costo_total=mov.costo_total,
        motivo=mov.motivo,
        referencia=mov.referencia,
        usuario_id=mov.usuario_id,
        usuario_nombre=mov.usuario.username if mov.usuario else None,
        fecha_movimiento=mov.fecha_movimiento
    )


@router.post("/movimientos", response_model=MovimientoResponse, status_code=status.HTTP_201_CREATED)
def crear_movimiento(
    movimiento_data: MovimientoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("inventario.movimiento"))
):
    """
    FN-MOV-003: Registrar movimiento manual.
    Permiso: inventario.movimiento
    
    Valida ubicaciones según tipo de movimiento.
    Actualiza inventario automáticamente.
    """
    usuario_id = current_user["user"].id
    mov = MovimientoService.crear_movimiento(db, movimiento_data, usuario_id)
    
    return MovimientoResponse(
        id=mov.id,
        producto_id=mov.producto.id,
        producto_nombre=mov.producto.nombre,
        producto_codigo=mov.producto.codigo,
        tipo_movimiento=mov.tipo_movimiento,
        cantidad=mov.cantidad,
        ubicacion_origen_id=mov.ubicacion_origen_id,
        ubicacion_origen_nombre=mov.ubicacion_origen.nombre if mov.ubicacion_origen else None,
        ubicacion_destino_id=mov.ubicacion_destino_id,
        ubicacion_destino_nombre=mov.ubicacion_destino.nombre if mov.ubicacion_destino else None,
        venta_id=mov.venta_id,
        costo_unitario=mov.costo_unitario,
        costo_total=mov.costo_total,
        motivo=mov.motivo,
        referencia=mov.referencia,
        usuario_id=mov.usuario_id,
        usuario_nombre=mov.usuario.username if mov.usuario else None,
        fecha_movimiento=mov.fecha_movimiento
    )


@router.post("/movimientos/compra", response_model=MovimientoResponse, status_code=status.HTTP_201_CREATED)
def registrar_compra(
    compra: CompraRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("inventario.comprar"))
):
    """
    FN-MOV-004: Registrar compra (endpoint simplificado).
    Permiso: inventario.comprar
    """
    usuario_id = current_user["user"].id
    mov = MovimientoService.registrar_compra(db, compra, usuario_id)
    
    return MovimientoResponse(
        id=mov.id,
        producto_id=mov.producto.id,
        producto_nombre=mov.producto.nombre,
        producto_codigo=mov.producto.codigo,
        tipo_movimiento=mov.tipo_movimiento,
        cantidad=mov.cantidad,
        ubicacion_origen_id=mov.ubicacion_origen_id,
        ubicacion_origen_nombre=None,
        ubicacion_destino_id=mov.ubicacion_destino_id,
        ubicacion_destino_nombre=mov.ubicacion_destino.nombre if mov.ubicacion_destino else None,
        venta_id=mov.venta_id,
        costo_unitario=mov.costo_unitario,
        costo_total=mov.costo_total,
        motivo=mov.motivo,
        referencia=mov.referencia,
        usuario_id=mov.usuario_id,
        usuario_nombre=mov.usuario.username if mov.usuario else None,
        fecha_movimiento=mov.fecha_movimiento
    )


@router.delete("/movimientos/{movimiento_id}")
def anular_movimiento(
    movimiento_id: int,
    motivo: str = Query(..., min_length=5, description="Motivo de la anulación"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("inventario.anular"))
):
    """
    FN-MOV-005: Anular movimiento creando movimiento inverso.
    Permiso: inventario.anular
    
    RN-006: No elimina el movimiento, crea uno inverso.
    """
    usuario_id = current_user["user"].id
    movimiento_inverso = MovimientoService.anular_movimiento(db, movimiento_id, motivo, usuario_id)
    
    return {
        "mensaje": "Movimiento anulado correctamente",
        "movimiento_original_id": movimiento_id,
        "movimiento_inverso_id": movimiento_inverso.id
    }


# ============================================
# ENDPOINTS DE REPORTES
# ============================================

@router.get("/reportes/resumen-inventario", response_model=ResumenInventarioResponse)
def reporte_resumen_inventario(
    ubicacion_id: Optional[int] = Query(None, description="Filtrar por ubicación"),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("reportes.ver"))
):
    """
    REP-003: Resumen de inventario por ubicación.
    Permiso: reportes.ver
    """
    return InventarioService.get_resumen_inventario(db, sede_id=user["user"].sede_id, ubicacion_id=ubicacion_id)


@router.get("/reportes/ventas-productos")
def reporte_ventas_productos(
    fecha_desde: date = Query(..., description="Fecha de inicio"),
    fecha_hasta: date = Query(..., description="Fecha de fin"),
    producto_id: Optional[int] = Query(None, description="Filtrar por producto"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("reportes.ver"))
):
    """
    REP-001: Reporte de ventas de productos por período.
    Permiso: reportes.ver
    
    Nota: Este endpoint requiere integración con el módulo POS.
    Por ahora retorna datos basados en movimientos tipo 'venta'.
    """
    from sqlalchemy import func
    from ..models.producto import MovimientoInventario, Producto
    
    query = db.query(
        Producto.id.label('producto_id'),
        Producto.nombre.label('producto_nombre'),
        Producto.codigo.label('producto_codigo'),
        func.sum(MovimientoInventario.cantidad).label('cantidad_vendida'),
        func.sum(MovimientoInventario.costo_total).label('monto_total')
    ).join(
        MovimientoInventario, Producto.id == MovimientoInventario.producto_id
    ).filter(
        MovimientoInventario.tipo_movimiento == 'venta',
        MovimientoInventario.fecha_movimiento >= fecha_desde,
        MovimientoInventario.fecha_movimiento <= fecha_hasta
    )
    
    if producto_id:
        query = query.filter(Producto.id == producto_id)
    
    query = query.group_by(Producto.id, Producto.nombre, Producto.codigo)
    query = query.order_by(func.sum(MovimientoInventario.cantidad).desc())
    query = query.limit(limit)
    
    resultados = query.all()
    
    return [
        {
            "producto_id": r.producto_id,
            "producto_nombre": r.producto_nombre,
            "producto_codigo": r.producto_codigo,
            "cantidad_vendida": r.cantidad_vendida or 0,
            "monto_total": float(r.monto_total or 0)
        }
        for r in resultados
    ]


@router.get("/reportes/productos-por-especialista")
def reporte_productos_por_especialista(
    fecha_desde: date = Query(..., description="Fecha de inicio"),
    fecha_hasta: date = Query(..., description="Fecha de fin"),
    especialista_id: Optional[int] = Query(None, description="Filtrar por especialista"),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("reportes.ver"))
):
    """
    REP-002: Reporte de productos vendidos por especialista.
    Permiso: reportes.ver
    
    Nota: Este endpoint requiere integración con el módulo POS y Ventas.
    Actualmente retorna placeholder hasta que se implemente el módulo POS.
    """
    # TODO: Implementar cuando el módulo POS esté disponible
    # El módulo POS debe registrar qué especialista realizó cada venta
    return {
        "mensaje": "Este reporte requiere integración con el módulo de Punto de Venta",
        "nota": "Se implementará cuando el módulo POS esté disponible"
    }


# ============================================
# ENDPOINT DE INICIALIZACIÓN
# ============================================

@router.post("/inicializar-ubicaciones", status_code=status.HTTP_201_CREATED)
def inicializar_ubicaciones(
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("inventario.configurar"))
):
    """
    Crear ubicaciones por defecto (Bodega y Vitrina) si no existen.
    Permiso: inventario.configurar
    """
    UbicacionService.inicializar_ubicaciones_por_defecto(db)
    return {"mensaje": "Ubicaciones inicializadas correctamente"}
