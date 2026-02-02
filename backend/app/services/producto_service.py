from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, desc
from typing import List, Optional, Tuple
from datetime import date, timedelta
from decimal import Decimal
from fastapi import HTTPException, status

from ..models.producto import Producto, Proveedor, UbicacionInventario, Inventario, MovimientoInventario
from ..schemas.producto import (
    ProveedorCreate, ProveedorUpdate,
    ProductoCreate, ProductoUpdate,
    UbicacionCreate, UbicacionUpdate,
    InventarioUbicacion, ProductoListResponse, ProductoAlertaStockBajo
)


class ProveedorService:
    """Servicio para gestión de proveedores"""

    # ============================================
    # CRUD DE PROVEEDORES
    # ============================================

    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        estado: Optional[str] = None,
        query: Optional[str] = None
    ) -> List[Proveedor]:
        """Listar proveedores con filtros opcionales"""
        q = db.query(Proveedor)
        
        if estado:
            q = q.filter(Proveedor.estado == estado)
        
        if query:
            search = f"%{query}%"
            q = q.filter(
                or_(
                    Proveedor.nombre.ilike(search),
                    Proveedor.contacto.ilike(search),
                    Proveedor.email.ilike(search)
                )
            )
        
        return q.order_by(Proveedor.nombre).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, proveedor_id: int) -> Optional[Proveedor]:
        """Obtener proveedor por ID"""
        return db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()

    @staticmethod
    def get_by_id_or_404(db: Session, proveedor_id: int) -> Proveedor:
        """Obtener proveedor por ID o lanzar 404"""
        proveedor = ProveedorService.get_by_id(db, proveedor_id)
        if not proveedor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Proveedor con ID {proveedor_id} no encontrado"
            )
        return proveedor

    @staticmethod
    def get_total_productos(db: Session, proveedor_id: int) -> int:
        """Obtener cantidad de productos de un proveedor"""
        return db.query(Producto).filter(Producto.proveedor_id == proveedor_id).count()

    @staticmethod
    def create(db: Session, proveedor: ProveedorCreate) -> Proveedor:
        """Crear nuevo proveedor"""
        db_proveedor = Proveedor(**proveedor.model_dump())
        db.add(db_proveedor)
        db.commit()
        db.refresh(db_proveedor)
        return db_proveedor

    @staticmethod
    def update(db: Session, proveedor_id: int, proveedor: ProveedorUpdate) -> Proveedor:
        """Actualizar proveedor"""
        db_proveedor = ProveedorService.get_by_id_or_404(db, proveedor_id)
        
        update_data = proveedor.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_proveedor, field, value)
        
        db.commit()
        db.refresh(db_proveedor)
        return db_proveedor

    @staticmethod
    def delete(db: Session, proveedor_id: int) -> None:
        """Eliminar proveedor (validando que no tenga productos)"""
        db_proveedor = ProveedorService.get_by_id_or_404(db, proveedor_id)
        
        # Validar que no tenga productos asociados
        total_productos = ProveedorService.get_total_productos(db, proveedor_id)
        if total_productos > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"No se puede eliminar el proveedor porque tiene {total_productos} productos asociados"
            )
        
        db.delete(db_proveedor)
        db.commit()

    @staticmethod
    def cambiar_estado(db: Session, proveedor_id: int, estado: str) -> Proveedor:
        """Cambiar estado del proveedor"""
        db_proveedor = ProveedorService.get_by_id_or_404(db, proveedor_id)
        db_proveedor.estado = estado
        db.commit()
        db.refresh(db_proveedor)
        return db_proveedor

    @staticmethod
    def get_productos_proveedor(db: Session, proveedor_id: int) -> List[Producto]:
        """Obtener productos de un proveedor"""
        ProveedorService.get_by_id_or_404(db, proveedor_id)  # Validar que existe
        return db.query(Producto).filter(
            Producto.proveedor_id == proveedor_id
        ).order_by(Producto.nombre).all()


class ProductoService:
    """Servicio para gestión de productos"""

    # ============================================
    # CONSULTAS DE PRODUCTOS
    # ============================================

    @staticmethod
    def get_all_paginado(
        db: Session,
        sede_id: int,
        query: Optional[str] = None,
        estado: str = 'activo',
        proveedor_id: Optional[int] = None,
        stock_bajo: bool = False,
        sin_stock: bool = False,
        precio_min: Optional[Decimal] = None,
        precio_max: Optional[Decimal] = None,
        pagina: int = 1,
        por_pagina: int = 20,
        ordenar_por: str = 'nombre',
        orden: str = 'asc'
    ) -> Tuple[List[Producto], int]:
        """Lista productos de una sede con filtros, búsqueda y paginación"""
        
        q = db.query(Producto).filter(Producto.sede_id == sede_id).options(joinedload(Producto.proveedor))
        
        # Filtro por estado
        if estado and estado != 'todos':
            q = q.filter(Producto.estado == estado)
        
        # Filtro por proveedor
        if proveedor_id:
            q = q.filter(Producto.proveedor_id == proveedor_id)
        
        # Filtro por rango de precios
        if precio_min is not None:
            q = q.filter(Producto.precio_venta >= precio_min)
        if precio_max is not None:
            q = q.filter(Producto.precio_venta <= precio_max)
        
        # Búsqueda por texto
        if query:
            search = f"%{query}%"
            q = q.filter(
                or_(
                    Producto.nombre.ilike(search),
                    Producto.codigo.ilike(search),
                    Producto.codigo_barras.ilike(search),
                    Producto.descripcion.ilike(search)
                )
            )
        
        # Contar total antes de paginar
        total = q.count()
        
        # Ordenamiento
        orden_columna = getattr(Producto, ordenar_por, Producto.nombre)
        if orden == 'desc':
            orden_columna = desc(orden_columna)
        q = q.order_by(orden_columna)
        
        # Paginación
        skip = (pagina - 1) * por_pagina
        productos = q.offset(skip).limit(por_pagina).all()
        
        return productos, total

    @staticmethod
    def get_by_id(db: Session, producto_id: int) -> Optional[Producto]:
        """Obtener producto por ID"""
        return db.query(Producto).options(
            joinedload(Producto.proveedor),
            joinedload(Producto.inventarios).joinedload(Inventario.ubicacion)
        ).filter(Producto.id == producto_id).first()

    @staticmethod
    def get_by_id_or_404(db: Session, producto_id: int) -> Producto:
        """Obtener producto por ID o lanzar 404"""
        producto = ProductoService.get_by_id(db, producto_id)
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID {producto_id} no encontrado"
            )
        return producto

    @staticmethod
    def get_by_codigo(db: Session, codigo: str) -> Optional[Producto]:
        """Obtener producto por código SKU"""
        return db.query(Producto).filter(Producto.codigo == codigo.upper()).first()

    @staticmethod
    def get_by_codigo_barras(db: Session, codigo_barras: str) -> Optional[Producto]:
        """Obtener producto por código de barras"""
        return db.query(Producto).filter(Producto.codigo_barras == codigo_barras).first()

    @staticmethod
    def get_stock_total(db: Session, producto_id: int) -> int:
        """Obtener stock total de un producto en todas las ubicaciones"""
        result = db.query(func.sum(Inventario.cantidad)).filter(
            Inventario.producto_id == producto_id
        ).scalar()
        return result or 0

    @staticmethod
    def get_inventario_por_ubicacion(db: Session, producto_id: int) -> List[InventarioUbicacion]:
        """Obtener inventario desglosado por ubicación"""
        inventarios = db.query(Inventario).options(
            joinedload(Inventario.ubicacion)
        ).filter(Inventario.producto_id == producto_id).all()
        
        return [
            InventarioUbicacion(
                ubicacion_id=inv.ubicacion.id,
                ubicacion_nombre=inv.ubicacion.nombre,
                cantidad=inv.cantidad
            )
            for inv in inventarios
        ]

    @staticmethod
    def get_activos(db: Session, sede_id: int) -> List[Producto]:
        """Listar solo productos activos de una sede (para POS)"""
        return db.query(Producto).filter(
            and_(Producto.estado == 'activo', Producto.sede_id == sede_id)
        ).order_by(Producto.nombre).all()

    # ============================================
    # CRUD DE PRODUCTOS
    # ============================================

    @staticmethod
    def create(db: Session, producto: ProductoCreate, usuario_id: int, sede_id: int) -> Producto:
        """
        Crear nuevo producto de una sede.
        RN-004: Códigos únicos
        """
        # Validar código SKU único
        if producto.codigo:
            existente = ProductoService.get_by_codigo(db, producto.codigo)
            if existente:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe un producto con el código '{producto.codigo}'"
                )
        
        # Validar código de barras único
        if producto.codigo_barras:
            existente = ProductoService.get_by_codigo_barras(db, producto.codigo_barras)
            if existente:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe un producto con el código de barras '{producto.codigo_barras}'"
                )
        
        # Validar proveedor existe
        if producto.proveedor_id:
            proveedor = db.query(Proveedor).filter(Proveedor.id == producto.proveedor_id).first()
            if not proveedor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Proveedor con ID {producto.proveedor_id} no encontrado"
                )
        
        # Crear producto (excluir campos de cantidad inicial)
        producto_data = producto.model_dump(exclude={'cantidad_inicial', 'ubicacion_inicial_id'})
        db_producto = Producto(**producto_data, sede_id=sede_id)
        db.add(db_producto)
        db.flush()  # Para obtener el ID
        
        # Si hay cantidad inicial, crear movimiento de compra
        if producto.cantidad_inicial and producto.cantidad_inicial > 0:
            ubicacion_id = producto.ubicacion_inicial_id
            
            # Si no se especifica ubicación, usar la principal (Bodega)
            if not ubicacion_id:
                ubicacion_principal = db.query(UbicacionInventario).filter(
                    UbicacionInventario.es_principal == 1
                ).first()
                if ubicacion_principal:
                    ubicacion_id = ubicacion_principal.id
            
            if ubicacion_id:
                # Crear registro de inventario
                inventario = Inventario(
                    producto_id=db_producto.id,
                    ubicacion_id=ubicacion_id,
                    cantidad=producto.cantidad_inicial
                )
                db.add(inventario)
                
                # Crear movimiento de compra
                movimiento = MovimientoInventario(
                    producto_id=db_producto.id,
                    tipo_movimiento='compra',
                    cantidad=producto.cantidad_inicial,
                    ubicacion_destino_id=ubicacion_id,
                    costo_unitario=producto.precio_compra,
                    costo_total=producto.precio_compra * producto.cantidad_inicial,
                    motivo="Inventario inicial al crear producto",
                    usuario_id=usuario_id
                )
                db.add(movimiento)
        
        db.commit()
        db.refresh(db_producto)
        return db_producto

    @staticmethod
    def update(db: Session, producto_id: int, producto: ProductoUpdate) -> Producto:
        """
        Actualizar producto.
        RN-004: Códigos únicos
        """
        db_producto = ProductoService.get_by_id_or_404(db, producto_id)
        
        update_data = producto.model_dump(exclude_unset=True)
        
        # Validar código SKU único
        if 'codigo' in update_data and update_data['codigo']:
            existente = ProductoService.get_by_codigo(db, update_data['codigo'])
            if existente and existente.id != producto_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe un producto con el código '{update_data['codigo']}'"
                )
        
        # Validar código de barras único
        if 'codigo_barras' in update_data and update_data['codigo_barras']:
            existente = ProductoService.get_by_codigo_barras(db, update_data['codigo_barras'])
            if existente and existente.id != producto_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe un producto con el código de barras '{update_data['codigo_barras']}'"
                )
        
        # Validar proveedor
        if 'proveedor_id' in update_data and update_data['proveedor_id']:
            proveedor = db.query(Proveedor).filter(Proveedor.id == update_data['proveedor_id']).first()
            if not proveedor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Proveedor con ID {update_data['proveedor_id']} no encontrado"
                )
        
        for field, value in update_data.items():
            setattr(db_producto, field, value)
        
        db.commit()
        db.refresh(db_producto)
        return db_producto

    @staticmethod
    def delete(db: Session, producto_id: int) -> None:
        """
        Eliminar producto.
        Nota: Elimina en cascada inventario y movimientos.
        """
        db_producto = ProductoService.get_by_id_or_404(db, producto_id)
        
        # Advertencia: esto elimina historial de movimientos
        db.delete(db_producto)
        db.commit()

    @staticmethod
    def cambiar_estado(db: Session, producto_id: int, estado: str) -> Producto:
        """Cambiar estado del producto"""
        db_producto = ProductoService.get_by_id_or_404(db, producto_id)
        db_producto.estado = estado
        db.commit()
        db.refresh(db_producto)
        return db_producto

    # ============================================
    # ALERTAS Y REPORTES
    # ============================================

    @staticmethod
    def get_productos_stock_bajo(db: Session) -> List[ProductoAlertaStockBajo]:
        """FN-PROD-008: Productos con stock bajo"""
        productos = db.query(Producto).filter(
            Producto.estado == 'activo',
            Producto.stock_minimo > 0
        ).options(
            joinedload(Producto.inventarios).joinedload(Inventario.ubicacion)
        ).all()
        
        resultado = []
        for producto in productos:
            stock_total = sum(inv.cantidad for inv in producto.inventarios)
            if stock_total < producto.stock_minimo:
                resultado.append(ProductoAlertaStockBajo(
                    id=producto.id,
                    codigo=producto.codigo,
                    nombre=producto.nombre,
                    stock_total=stock_total,
                    stock_minimo=producto.stock_minimo,
                    diferencia=producto.stock_minimo - stock_total,
                    inventario_por_ubicacion=[
                        InventarioUbicacion(
                            ubicacion_id=inv.ubicacion.id,
                            ubicacion_nombre=inv.ubicacion.nombre,
                            cantidad=inv.cantidad
                        )
                        for inv in producto.inventarios
                    ]
                ))
        
        return resultado

    @staticmethod
    def get_productos_sin_stock(db: Session) -> List[Producto]:
        """FN-PROD-009: Productos sin stock"""
        # Subquery para obtener stock total por producto
        subq = db.query(
            Inventario.producto_id,
            func.sum(Inventario.cantidad).label('stock_total')
        ).group_by(Inventario.producto_id).subquery()
        
        # Productos activos con stock total = 0 o sin registros de inventario
        productos_con_stock = db.query(Producto).join(
            subq, Producto.id == subq.c.producto_id
        ).filter(
            Producto.estado == 'activo',
            subq.c.stock_total == 0
        ).all()
        
        # Productos sin ningún registro de inventario
        productos_ids_con_inventario = db.query(Inventario.producto_id).distinct()
        productos_sin_inventario = db.query(Producto).filter(
            Producto.estado == 'activo',
            ~Producto.id.in_(productos_ids_con_inventario)
        ).all()
        
        return productos_con_stock + productos_sin_inventario

    @staticmethod
    def get_productos_por_vencer(db: Session, dias: int = 30) -> List[Producto]:
        """FN-PROD-010: Productos próximos a vencer"""
        fecha_limite = date.today() + timedelta(days=dias)
        
        return db.query(Producto).options(
            joinedload(Producto.inventarios).joinedload(Inventario.ubicacion)
        ).filter(
            Producto.estado == 'activo',
            Producto.fecha_vencimiento.isnot(None),
            Producto.fecha_vencimiento >= date.today(),
            Producto.fecha_vencimiento <= fecha_limite
        ).order_by(Producto.fecha_vencimiento).all()


class UbicacionService:
    """Servicio para gestión de ubicaciones de inventario"""

    @staticmethod
    def get_all(
        db: Session,
        sede_id: int,
        tipo: Optional[str] = None,
        estado: Optional[str] = None
    ) -> List[UbicacionInventario]:
        """Listar ubicaciones de una sede con filtros"""
        q = db.query(UbicacionInventario).filter(UbicacionInventario.sede_id == sede_id)
        
        if tipo:
            q = q.filter(UbicacionInventario.tipo == tipo)
        if estado:
            q = q.filter(UbicacionInventario.estado == estado)
        
        return q.order_by(UbicacionInventario.nombre).all()

    @staticmethod
    def get_by_id(db: Session, ubicacion_id: int) -> Optional[UbicacionInventario]:
        """Obtener ubicación por ID"""
        return db.query(UbicacionInventario).filter(
            UbicacionInventario.id == ubicacion_id
        ).first()

    @staticmethod
    def get_by_id_or_404(db: Session, ubicacion_id: int) -> UbicacionInventario:
        """Obtener ubicación por ID o lanzar 404"""
        ubicacion = UbicacionService.get_by_id(db, ubicacion_id)
        if not ubicacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ubicación con ID {ubicacion_id} no encontrado"
            )
        return ubicacion

    @staticmethod
    def get_by_nombre(db: Session, sede_id: int, nombre: str) -> Optional[UbicacionInventario]:
        """Obtener ubicación de una sede por nombre"""
        return db.query(UbicacionInventario).filter(
            and_(UbicacionInventario.nombre == nombre, UbicacionInventario.sede_id == sede_id)
        ).first()

    @staticmethod
    def get_estadisticas(db: Session, ubicacion_id: int) -> dict:
        """Obtener estadísticas de una ubicación"""
        inventarios = db.query(Inventario).options(
            joinedload(Inventario.producto)
        ).filter(Inventario.ubicacion_id == ubicacion_id).all()
        
        total_productos = len(inventarios)
        valor_total = sum(
            inv.cantidad * float(inv.producto.precio_venta)
            for inv in inventarios
        )
        
        return {
            'total_productos': total_productos,
            'valor_total': Decimal(str(valor_total))
        }

    @staticmethod
    def create(db: Session, ubicacion: UbicacionCreate, sede_id: int) -> UbicacionInventario:
        """Crear nueva ubicación para una sede"""
        # Validar nombre único en la sede
        existente = UbicacionService.get_by_nombre(db, sede_id, ubicacion.nombre)
        if existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe una ubicación con el nombre '{ubicacion.nombre}'"
            )
        
        # Si es principal, quitar el flag de otras ubicaciones de la misma sede
        if ubicacion.es_principal:
            db.query(UbicacionInventario).filter(
                and_(UbicacionInventario.es_principal == 1, UbicacionInventario.sede_id == sede_id)
            ).update({UbicacionInventario.es_principal: 0})
        
        ubicacion_data = ubicacion.model_dump()
        ubicacion_data['es_principal'] = 1 if ubicacion.es_principal else 0
        
        db_ubicacion = UbicacionInventario(**ubicacion_data, sede_id=sede_id)
        db.add(db_ubicacion)
        db.commit()
        db.refresh(db_ubicacion)
        return db_ubicacion

    @staticmethod
    def update(db: Session, ubicacion_id: int, ubicacion: UbicacionUpdate) -> UbicacionInventario:
        """Actualizar ubicación"""
        db_ubicacion = UbicacionService.get_by_id_or_404(db, ubicacion_id)
        
        update_data = ubicacion.model_dump(exclude_unset=True)
        
        # Validar nombre único
        if 'nombre' in update_data:
            existente = UbicacionService.get_by_nombre(db, update_data['nombre'])
            if existente and existente.id != ubicacion_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe una ubicación con el nombre '{update_data['nombre']}'"
                )
        
        # Si se establece como principal, quitar flag de otras
        if update_data.get('es_principal'):
            db.query(UbicacionInventario).filter(
                UbicacionInventario.es_principal == 1,
                UbicacionInventario.id != ubicacion_id
            ).update({UbicacionInventario.es_principal: 0})
            update_data['es_principal'] = 1
        elif 'es_principal' in update_data:
            update_data['es_principal'] = 0
        
        for field, value in update_data.items():
            setattr(db_ubicacion, field, value)
        
        db.commit()
        db.refresh(db_ubicacion)
        return db_ubicacion

    @staticmethod
    def get_productos_ubicacion(db: Session, ubicacion_id: int) -> List[dict]:
        """Obtener productos con su stock en una ubicación"""
        UbicacionService.get_by_id_or_404(db, ubicacion_id)
        
        inventarios = db.query(Inventario).options(
            joinedload(Inventario.producto)
        ).filter(
            Inventario.ubicacion_id == ubicacion_id,
            Inventario.cantidad > 0
        ).all()
        
        return [
            {
                'producto_id': inv.producto.id,
                'producto_codigo': inv.producto.codigo,
                'producto_nombre': inv.producto.nombre,
                'cantidad': inv.cantidad,
                'precio_venta': inv.producto.precio_venta,
                'valor_total': inv.cantidad * float(inv.producto.precio_venta)
            }
            for inv in inventarios
        ]

    @staticmethod
    def inicializar_ubicaciones_por_defecto(db: Session) -> None:
        """Crear ubicaciones por defecto si no existen"""
        # Bodega (principal)
        if not UbicacionService.get_by_nombre(db, "Bodega"):
            bodega = UbicacionInventario(
                nombre="Bodega",
                tipo="bodega",
                descripcion="Almacenamiento principal",
                es_principal=1,
                estado="activo"
            )
            db.add(bodega)
        
        # Vitrina
        if not UbicacionService.get_by_nombre(db, "Vitrina"):
            vitrina = UbicacionInventario(
                nombre="Vitrina",
                tipo="vitrina",
                descripcion="Punto de venta",
                es_principal=0,
                estado="activo"
            )
            db.add(vitrina)
        
        db.commit()
