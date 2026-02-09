from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from datetime import date

from ..database import get_db
from ..dependencies import require_permission
from ..schemas.producto import (
    # Proveedor
    ProveedorCreate, ProveedorUpdate, ProveedorResponse, ProveedorListResponse,
    # Producto
    ProductoCreate, ProductoUpdate, ProductoResponse, ProductoListResponse, ProductoPaginado,
    InventarioUbicacion, ProductoAlertaStockBajo, ProductoAlertaVencimiento,
    # Ubicación
    UbicacionCreate, UbicacionUpdate, UbicacionResponse,
    # Operaciones masivas
    ActualizarPreciosMasivoRequest, ActualizarPreciosResponse,
    EstadoProducto, EstadoProveedor
)
from ..services.producto_service import ProveedorService, ProductoService, UbicacionService
from ..services.inventario_service import MovimientoService, OperacionesMasivasService


# ============================================
# ROUTER DE PROVEEDORES
# ============================================

proveedores_router = APIRouter(
    prefix="/api/productos/proveedores",
    tags=["Proveedores"]
)


@proveedores_router.get("", response_model=List[ProveedorListResponse])
def listar_proveedores(
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    query: Optional[str] = Query(None, description="Búsqueda por texto"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.ver"))
):
    """
    FN-PRV-001: Listar proveedores con filtros opcionales.
    Permiso: productos.ver
    """
    proveedores = ProveedorService.get_all(db, skip=skip, limit=limit, estado=estado, query=query)
    
    result = []
    for proveedor in proveedores:
        total = ProveedorService.get_total_productos(db, proveedor.id)
        result.append(ProveedorListResponse(
            id=proveedor.id,
            nombre=proveedor.nombre,
            contacto=proveedor.contacto,
            telefono=proveedor.telefono,
            email=proveedor.email,
            estado=proveedor.estado,
            total_productos=total
        ))
    
    return result


@proveedores_router.get("/{proveedor_id}", response_model=ProveedorResponse)
def obtener_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.ver"))
):
    """
    FN-PRV-002: Obtener detalle de un proveedor.
    Permiso: productos.ver
    """
    proveedor = ProveedorService.get_by_id_or_404(db, proveedor_id)
    total = ProveedorService.get_total_productos(db, proveedor_id)
    
    return ProveedorResponse(
        id=proveedor.id,
        nombre=proveedor.nombre,
        contacto=proveedor.contacto,
        telefono=proveedor.telefono,
        email=proveedor.email,
        direccion=proveedor.direccion,
        notas=proveedor.notas,
        estado=proveedor.estado,
        total_productos=total,
        fecha_creacion=proveedor.fecha_creacion,
        fecha_actualizacion=proveedor.fecha_actualizacion
    )


@proveedores_router.post("", response_model=ProveedorResponse, status_code=status.HTTP_201_CREATED)
def crear_proveedor(
    proveedor_data: ProveedorCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.crear"))
):
    """
    FN-PRV-003: Crear nuevo proveedor.
    Permiso: productos.crear
    """
    proveedor = ProveedorService.create(db, proveedor_data)
    return ProveedorResponse(
        id=proveedor.id,
        nombre=proveedor.nombre,
        contacto=proveedor.contacto,
        telefono=proveedor.telefono,
        email=proveedor.email,
        direccion=proveedor.direccion,
        notas=proveedor.notas,
        estado=proveedor.estado,
        total_productos=0,
        fecha_creacion=proveedor.fecha_creacion,
        fecha_actualizacion=proveedor.fecha_actualizacion
    )


@proveedores_router.put("/{proveedor_id}", response_model=ProveedorResponse)
def actualizar_proveedor(
    proveedor_id: int,
    proveedor_data: ProveedorUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.editar"))
):
    """
    FN-PRV-004: Actualizar proveedor.
    Permiso: productos.editar
    """
    proveedor = ProveedorService.update(db, proveedor_id, proveedor_data)
    total = ProveedorService.get_total_productos(db, proveedor_id)
    
    return ProveedorResponse(
        id=proveedor.id,
        nombre=proveedor.nombre,
        contacto=proveedor.contacto,
        telefono=proveedor.telefono,
        email=proveedor.email,
        direccion=proveedor.direccion,
        notas=proveedor.notas,
        estado=proveedor.estado,
        total_productos=total,
        fecha_creacion=proveedor.fecha_creacion,
        fecha_actualizacion=proveedor.fecha_actualizacion
    )


@proveedores_router.delete("/{proveedor_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.eliminar"))
):
    """
    FN-PRV-005: Eliminar proveedor.
    Permiso: productos.eliminar
    
    No permite eliminación si tiene productos asociados.
    """
    ProveedorService.delete(db, proveedor_id)


@proveedores_router.put("/{proveedor_id}/estado", response_model=ProveedorResponse)
def cambiar_estado_proveedor(
    proveedor_id: int,
    estado: EstadoProveedor = Query(..., description="Nuevo estado"),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.editar"))
):
    """
    FN-PRV-006: Cambiar estado de proveedor.
    Permiso: productos.editar
    """
    proveedor = ProveedorService.cambiar_estado(db, proveedor_id, estado.value)
    total = ProveedorService.get_total_productos(db, proveedor_id)
    
    return ProveedorResponse(
        id=proveedor.id,
        nombre=proveedor.nombre,
        contacto=proveedor.contacto,
        telefono=proveedor.telefono,
        email=proveedor.email,
        direccion=proveedor.direccion,
        notas=proveedor.notas,
        estado=proveedor.estado,
        total_productos=total,
        fecha_creacion=proveedor.fecha_creacion,
        fecha_actualizacion=proveedor.fecha_actualizacion
    )


@proveedores_router.get("/{proveedor_id}/productos", response_model=List[ProductoListResponse])
def listar_productos_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.ver"))
):
    """
    FN-PRV-007: Listar productos de un proveedor.
    Permiso: productos.ver
    """
    productos = ProveedorService.get_productos_proveedor(db, proveedor_id)
    
    result = []
    for producto in productos:
        stock_total = ProductoService.get_stock_total(db, producto.id)
        result.append(ProductoListResponse(
            id=producto.id,
            codigo=producto.codigo,
            codigo_barras=producto.codigo_barras,
            nombre=producto.nombre,
            precio_compra=producto.precio_compra,
            precio_venta=producto.precio_venta,
            stock_total=stock_total,
            stock_minimo=producto.stock_minimo,
            estado=producto.estado,
            proveedor_nombre=producto.proveedor.nombre if producto.proveedor else None,
            alerta_stock_bajo=producto.stock_minimo > 0 and stock_total < producto.stock_minimo
        ))
    
    return result


# ============================================
# ROUTER DE PRODUCTOS
# ============================================

productos_router = APIRouter(
    prefix="/api/productos",
    tags=["Productos"]
)


@productos_router.get("", response_model=ProductoPaginado)
def listar_productos(
    query: Optional[str] = Query(None, description="Búsqueda por texto"),
    estado: str = Query('activo', description="Filtro por estado"),
    proveedor_id: Optional[int] = Query(None, description="Filtrar por proveedor"),
    stock_bajo: bool = Query(False, description="Solo productos con stock bajo"),
    sin_stock: bool = Query(False, description="Solo productos sin stock"),
    precio_min: Optional[Decimal] = Query(None, description="Precio mínimo"),
    precio_max: Optional[Decimal] = Query(None, description="Precio máximo"),
    pagina: int = Query(1, ge=1, description="Número de página"),
    por_pagina: int = Query(20, ge=1, le=100, description="Resultados por página"),
    ordenar_por: str = Query('nombre', description="Campo para ordenar"),
    orden: str = Query('asc', pattern='^(asc|desc)$'),
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("productos.ver"))
):
    """
    FN-PROD-001: Listar productos con filtros y paginación.
    Permiso: productos.ver
    """
    productos, total = ProductoService.get_all_paginado(
        db,
        sede_id=user["user"].sede_id,
        query=query,
        estado=estado,
        proveedor_id=proveedor_id,
        stock_bajo=stock_bajo,
        sin_stock=sin_stock,
        precio_min=precio_min,
        precio_max=precio_max,
        pagina=pagina,
        por_pagina=por_pagina,
        ordenar_por=ordenar_por,
        orden=orden
    )
    
    items = []
    for producto in productos:
        stock_total = ProductoService.get_stock_total(db, producto.id)
        items.append(ProductoListResponse(
            id=producto.id,
            codigo=producto.codigo,
            codigo_barras=producto.codigo_barras,
            nombre=producto.nombre,
            precio_compra=producto.precio_compra,
            precio_venta=producto.precio_venta,
            stock_total=stock_total,
            stock_minimo=producto.stock_minimo,
            estado=producto.estado,
            proveedor_nombre=producto.proveedor.nombre if producto.proveedor else None,
            alerta_stock_bajo=producto.stock_minimo > 0 and stock_total < producto.stock_minimo
        ))
    
    total_paginas = (total + por_pagina - 1) // por_pagina
    
    return ProductoPaginado(
        total=total,
        pagina=pagina,
        por_pagina=por_pagina,
        total_paginas=total_paginas,
        items=items
    )


@productos_router.get("/activos", response_model=List[ProductoListResponse])
def listar_productos_activos(
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("productos.ver"))
):
    """
    Productos activos para selectores (POS, etc.).
    Permiso: productos.ver
    """
    productos = ProductoService.get_activos(db, user["user"].sede_id)
    
    result = []
    for producto in productos:
        stock_total = ProductoService.get_stock_total(db, producto.id)
        result.append(ProductoListResponse(
            id=producto.id,
            codigo=producto.codigo,
            codigo_barras=producto.codigo_barras,
            nombre=producto.nombre,
            precio_compra=producto.precio_compra,
            precio_venta=producto.precio_venta,
            stock_total=stock_total,
            stock_minimo=producto.stock_minimo,
            estado=producto.estado,
            proveedor_nombre=producto.proveedor.nombre if producto.proveedor else None,
            alerta_stock_bajo=producto.stock_minimo > 0 and stock_total < producto.stock_minimo
        ))
    
    return result


@productos_router.get("/alertas/stock-bajo", response_model=List[ProductoAlertaStockBajo])
def productos_stock_bajo(
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.ver"))
):
    """
    FN-PROD-008: Productos con stock bajo.
    Permiso: productos.ver
    """
    return ProductoService.get_productos_stock_bajo(db)


@productos_router.get("/alertas/sin-stock", response_model=List[ProductoListResponse])
def productos_sin_stock(
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.ver"))
):
    """
    FN-PROD-009: Productos sin stock.
    Permiso: productos.ver
    """
    productos = ProductoService.get_productos_sin_stock(db)
    
    result = []
    for producto in productos:
        result.append(ProductoListResponse(
            id=producto.id,
            codigo=producto.codigo,
            codigo_barras=producto.codigo_barras,
            nombre=producto.nombre,
            precio_compra=producto.precio_compra,
            precio_venta=producto.precio_venta,
            stock_total=0,
            stock_minimo=producto.stock_minimo,
            estado=producto.estado,
            proveedor_nombre=producto.proveedor.nombre if producto.proveedor else None,
            alerta_stock_bajo=True
        ))
    
    return result


@productos_router.get("/alertas/vencimiento-proximo", response_model=List[ProductoAlertaVencimiento])
def productos_por_vencer(
    dias: int = Query(30, ge=1, le=365, description="Días para vencimiento"),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.ver"))
):
    """
    FN-PROD-010: Productos próximos a vencer.
    Permiso: productos.ver
    """
    productos = ProductoService.get_productos_por_vencer(db, dias)
    
    result = []
    hoy = date.today()
    for producto in productos:
        stock_total = ProductoService.get_stock_total(db, producto.id)
        dias_para_vencer = (producto.fecha_vencimiento - hoy).days
        result.append(ProductoAlertaVencimiento(
            id=producto.id,
            codigo=producto.codigo,
            nombre=producto.nombre,
            fecha_vencimiento=producto.fecha_vencimiento,
            dias_para_vencer=dias_para_vencer,
            stock_total=stock_total
        ))
    
    return result


@productos_router.get("/{producto_id}", response_model=ProductoResponse)
def obtener_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.ver"))
):
    """
    FN-PROD-002: Obtener detalle de un producto.
    Permiso: productos.ver
    """
    producto = ProductoService.get_by_id_or_404(db, producto_id)
    stock_total = ProductoService.get_stock_total(db, producto_id)
    inventario_por_ubicacion = ProductoService.get_inventario_por_ubicacion(db, producto_id)
    
    return ProductoResponse(
        id=producto.id,
        codigo=producto.codigo,
        codigo_barras=producto.codigo_barras,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio_compra=producto.precio_compra,
        precio_venta=producto.precio_venta,
        stock_minimo=producto.stock_minimo,
        stock_maximo=producto.stock_maximo,
        fecha_vencimiento=producto.fecha_vencimiento,
        lote=producto.lote,
        imagen_url=producto.imagen_url,
        proveedor_id=producto.proveedor_id,
        estado=producto.estado,
        stock_total=stock_total,
        margen_ganancia=producto.margen_ganancia,
        inventario_por_ubicacion=inventario_por_ubicacion,
        proveedor_nombre=producto.proveedor.nombre if producto.proveedor else None,
        fecha_creacion=producto.fecha_creacion,
        fecha_actualizacion=producto.fecha_actualizacion
    )


@productos_router.post("", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(
    producto_data: ProductoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("productos.crear"))
):
    """
    FN-PROD-003: Crear nuevo producto.
    Permiso: productos.crear
    """
    usuario_id = current_user["user"].id
    producto = ProductoService.create(db, producto_data, usuario_id, current_user["user"].sede_id)
    
    stock_total = ProductoService.get_stock_total(db, producto.id)
    inventario_por_ubicacion = ProductoService.get_inventario_por_ubicacion(db, producto.id)
    
    return ProductoResponse(
        id=producto.id,
        codigo=producto.codigo,
        codigo_barras=producto.codigo_barras,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio_compra=producto.precio_compra,
        precio_venta=producto.precio_venta,
        stock_minimo=producto.stock_minimo,
        stock_maximo=producto.stock_maximo,
        fecha_vencimiento=producto.fecha_vencimiento,
        lote=producto.lote,
        imagen_url=producto.imagen_url,
        proveedor_id=producto.proveedor_id,
        estado=producto.estado,
        stock_total=stock_total,
        margen_ganancia=producto.margen_ganancia,
        inventario_por_ubicacion=inventario_por_ubicacion,
        proveedor_nombre=producto.proveedor.nombre if producto.proveedor else None,
        fecha_creacion=producto.fecha_creacion,
        fecha_actualizacion=producto.fecha_actualizacion
    )


@productos_router.put("/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(
    producto_id: int,
    producto_data: ProductoUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.editar"))
):
    """
    FN-PROD-004: Actualizar producto.
    Permiso: productos.editar
    """
    producto = ProductoService.update(db, producto_id, producto_data)
    
    stock_total = ProductoService.get_stock_total(db, producto.id)
    inventario_por_ubicacion = ProductoService.get_inventario_por_ubicacion(db, producto.id)
    
    return ProductoResponse(
        id=producto.id,
        codigo=producto.codigo,
        codigo_barras=producto.codigo_barras,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio_compra=producto.precio_compra,
        precio_venta=producto.precio_venta,
        stock_minimo=producto.stock_minimo,
        stock_maximo=producto.stock_maximo,
        fecha_vencimiento=producto.fecha_vencimiento,
        lote=producto.lote,
        imagen_url=producto.imagen_url,
        proveedor_id=producto.proveedor_id,
        estado=producto.estado,
        stock_total=stock_total,
        margen_ganancia=producto.margen_ganancia,
        inventario_por_ubicacion=inventario_por_ubicacion,
        proveedor_nombre=producto.proveedor.nombre if producto.proveedor else None,
        fecha_creacion=producto.fecha_creacion,
        fecha_actualizacion=producto.fecha_actualizacion
    )


@productos_router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.eliminar"))
):
    """
    FN-PROD-005: Eliminar producto.
    Permiso: productos.eliminar
    
    ADVERTENCIA: Esto elimina también el historial de movimientos.
    Considerar marcar como 'descontinuado' en su lugar.
    """
    ProductoService.delete(db, producto_id)


@productos_router.put("/{producto_id}/estado", response_model=ProductoResponse)
def cambiar_estado_producto(
    producto_id: int,
    estado: EstadoProducto = Query(..., description="Nuevo estado"),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.editar"))
):
    """
    FN-PROD-006: Cambiar estado de producto.
    Permiso: productos.editar
    """
    producto = ProductoService.cambiar_estado(db, producto_id, estado.value)
    
    stock_total = ProductoService.get_stock_total(db, producto.id)
    inventario_por_ubicacion = ProductoService.get_inventario_por_ubicacion(db, producto.id)
    
    return ProductoResponse(
        id=producto.id,
        codigo=producto.codigo,
        codigo_barras=producto.codigo_barras,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio_compra=producto.precio_compra,
        precio_venta=producto.precio_venta,
        stock_minimo=producto.stock_minimo,
        stock_maximo=producto.stock_maximo,
        fecha_vencimiento=producto.fecha_vencimiento,
        lote=producto.lote,
        imagen_url=producto.imagen_url,
        proveedor_id=producto.proveedor_id,
        estado=producto.estado,
        stock_total=stock_total,
        margen_ganancia=producto.margen_ganancia,
        inventario_por_ubicacion=inventario_por_ubicacion,
        proveedor_nombre=producto.proveedor.nombre if producto.proveedor else None,
        fecha_creacion=producto.fecha_creacion,
        fecha_actualizacion=producto.fecha_actualizacion
    )


@productos_router.get("/{producto_id}/movimientos")
def obtener_movimientos_producto(
    producto_id: int,
    tipo_movimiento: Optional[str] = Query(None, description="Filtrar por tipo"),
    fecha_desde: Optional[date] = Query(None, description="Fecha desde"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha hasta"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.ver"))
):
    """
    FN-PROD-007: Historial de movimientos de un producto.
    Permiso: productos.ver
    """
    # Validar que el producto existe
    ProductoService.get_by_id_or_404(db, producto_id)
    
    movimientos = MovimientoService.get_movimientos_producto(
        db,
        producto_id=producto_id,
        tipo_movimiento=tipo_movimiento,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        skip=skip,
        limit=limit
    )
    
    return [
        {
            "id": mov.id,
            "tipo_movimiento": mov.tipo_movimiento,
            "cantidad": mov.cantidad,
            "ubicacion_origen": mov.ubicacion_origen.nombre if mov.ubicacion_origen else None,
            "ubicacion_destino": mov.ubicacion_destino.nombre if mov.ubicacion_destino else None,
            "costo_unitario": mov.costo_unitario,
            "costo_total": mov.costo_total,
            "motivo": mov.motivo,
            "referencia": mov.referencia,
            "usuario": mov.usuario.username if mov.usuario else None,
            "fecha_movimiento": mov.fecha_movimiento
        }
        for mov in movimientos
    ]


@productos_router.get("/{producto_id}/ventas")
def obtener_ventas_producto(
    producto_id: int,
    fecha_desde: Optional[date] = Query(None, description="Fecha desde"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha hasta"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.ver"))
):
    """
    FN-PROD-011: Historial de ventas de un producto.
    Permiso: productos.ver
    """
    from ..models.caja import DetalleFactura, Factura
    from sqlalchemy import and_
    
    # Validar que el producto existe
    ProductoService.get_by_id_or_404(db, producto_id)
    
    # Consultar ventas del producto
    query = db.query(DetalleFactura).join(Factura).filter(
        and_(
            DetalleFactura.tipo == 'producto',
            DetalleFactura.item_id == producto_id,
            Factura.estado != 'anulada'
        )
    )
    
    if fecha_desde:
        query = query.filter(Factura.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Factura.fecha <= fecha_hasta)
    
    ventas = query.order_by(Factura.fecha.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": venta.id,
            "factura_id": venta.factura_id,
            "numero_factura": venta.factura.numero_factura,
            "cantidad": float(venta.cantidad),
            "precio_unitario": float(venta.precio_unitario),
            "descuento_linea": float(venta.descuento_linea) if venta.descuento_linea else 0,
            "subtotal": float(venta.subtotal),
            "fecha": venta.factura.fecha,
            "cliente_id": venta.factura.cliente_id,
            "especialista_id": venta.especialista_id,
            "usuario": venta.factura.usuario.username if venta.factura.usuario else None
        }
        for venta in ventas
    ]


@productos_router.post("/actualizar-precios-masivo", response_model=ActualizarPreciosResponse)
def actualizar_precios_masivo(
    request: ActualizarPreciosMasivoRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("productos.editar"))
):
    """
    FN-MAS-001: Actualizar precios de múltiples productos.
    Permiso: productos.editar
    """
    return OperacionesMasivasService.actualizar_precios_masivo(db, request)
