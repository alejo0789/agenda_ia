from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, and_
from typing import List, Optional, Tuple
from datetime import datetime, date
from decimal import Decimal
from fastapi import HTTPException, status

from ..models.producto import Producto, UbicacionInventario, Inventario, MovimientoInventario
from ..schemas.producto import (
    MovimientoCreate, CompraRequest, AjusteInventarioRequest, TransferenciaRequest,
    ConteoFisicoRequest, ConteoFisicoResponse, ConteoFisicoResultado,
    ActualizarPreciosMasivoRequest, ActualizarPreciosResponse, ActualizarPreciosResultado,
    ResumenInventarioUbicacion, ResumenInventarioResponse, TipoMovimiento
)


# Mapeo de tipos de movimiento a ubicaciones requeridas
UBICACIONES_REQUERIDAS = {
    'compra': {'destino': True, 'origen': False},
    'venta': {'destino': False, 'origen': True},
    'ajuste_positivo': {'destino': True, 'origen': False},
    'ajuste_negativo': {'destino': False, 'origen': True},
    'transferencia': {'destino': True, 'origen': True},
    'uso_interno': {'destino': False, 'origen': True},
    'devolucion': {'destino': True, 'origen': False},
    'merma': {'destino': False, 'origen': True},
    'muestra': {'destino': False, 'origen': True},
    'donacion': {'destino': False, 'origen': True},
}

# Tipos que incrementan stock en destino
TIPOS_INCREMENTO = ['compra', 'ajuste_positivo', 'devolucion']
# Tipos que decrementan stock en origen
TIPOS_DECREMENTO = ['venta', 'ajuste_negativo', 'uso_interno', 'merma', 'muestra', 'donacion']


class InventarioService:
    """Servicio para gestión de inventario"""

    # ============================================
    # CONSULTAS DE INVENTARIO
    # ============================================

    @staticmethod
    def get_all(
        db: Session,
        sede_id: int,
        producto_id: Optional[int] = None,
        ubicacion_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Inventario]:
        """Listar inventario de una sede con filtros"""
        q = db.query(Inventario).join(UbicacionInventario).filter(UbicacionInventario.sede_id == sede_id).options(
            joinedload(Inventario.producto),
            joinedload(Inventario.ubicacion)
        )
        
        if producto_id:
            q = q.filter(Inventario.producto_id == producto_id)
        if ubicacion_id:
            q = q.filter(Inventario.ubicacion_id == ubicacion_id)
        
        return q.offset(skip).limit(limit).all()

    @staticmethod
    def get_stock(db: Session, producto_id: int, ubicacion_id: int) -> int:
        """Obtener stock de un producto en una ubicación"""
        inventario = db.query(Inventario).filter(
            Inventario.producto_id == producto_id,
            Inventario.ubicacion_id == ubicacion_id
        ).first()
        return inventario.cantidad if inventario else 0

    @staticmethod
    def get_o_crear_inventario(db: Session, producto_id: int, ubicacion_id: int) -> Inventario:
        """Obtener registro de inventario o crearlo si no existe"""
        inventario = db.query(Inventario).filter(
            Inventario.producto_id == producto_id,
            Inventario.ubicacion_id == ubicacion_id
        ).first()
        
        if not inventario:
            inventario = Inventario(
                producto_id=producto_id,
                ubicacion_id=ubicacion_id,
                cantidad=0
            )
            db.add(inventario)
            db.flush()
        
        return inventario

    # ============================================
    # OPERACIONES DE INVENTARIO
    # ============================================

    @staticmethod
    def ajustar_inventario(
        db: Session,
        ajuste: AjusteInventarioRequest,
        usuario_id: int
    ) -> dict:
        """
        FN-INV-002: Ajustar inventario manualmente.
        Crea movimiento de ajuste según la diferencia.
        """
        # Validar producto
        producto = db.query(Producto).filter(Producto.id == ajuste.producto_id).first()
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID {ajuste.producto_id} no encontrado"
            )
        
        # Validar ubicación
        ubicacion = db.query(UbicacionInventario).filter(
            UbicacionInventario.id == ajuste.ubicacion_id
        ).first()
        if not ubicacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ubicación con ID {ajuste.ubicacion_id} no encontrada"
            )
        
        # Obtener cantidad actual
        cantidad_actual = InventarioService.get_stock(db, ajuste.producto_id, ajuste.ubicacion_id)
        diferencia = ajuste.cantidad_nueva - cantidad_actual
        
        if diferencia == 0:
            return {
                "mensaje": "No hay diferencia, no se realizó ajuste",
                "cantidad_anterior": cantidad_actual,
                "cantidad_nueva": ajuste.cantidad_nueva,
                "diferencia": 0
            }
        
        # Determinar tipo de movimiento
        tipo_movimiento = 'ajuste_positivo' if diferencia > 0 else 'ajuste_negativo'
        cantidad_movimiento = abs(diferencia)
        
        # Crear movimiento
        movimiento_data = {
            'producto_id': ajuste.producto_id,
            'tipo_movimiento': tipo_movimiento,
            'cantidad': cantidad_movimiento,
            'motivo': ajuste.motivo,
            'usuario_id': usuario_id
        }
        
        if tipo_movimiento == 'ajuste_positivo':
            movimiento_data['ubicacion_destino_id'] = ajuste.ubicacion_id
        else:
            movimiento_data['ubicacion_origen_id'] = ajuste.ubicacion_id
        
        movimiento = MovimientoInventario(**movimiento_data)
        db.add(movimiento)
        
        # Actualizar inventario
        inventario = InventarioService.get_o_crear_inventario(db, ajuste.producto_id, ajuste.ubicacion_id)
        inventario.cantidad = ajuste.cantidad_nueva
        
        db.commit()
        
        return {
            "mensaje": "Ajuste realizado correctamente",
            "cantidad_anterior": cantidad_actual,
            "cantidad_nueva": ajuste.cantidad_nueva,
            "diferencia": diferencia,
            "tipo_movimiento": tipo_movimiento,
            "movimiento_id": movimiento.id
        }

    @staticmethod
    def transferir(
        db: Session,
        transferencia: TransferenciaRequest,
        usuario_id: int
    ) -> MovimientoInventario:
        """
        FN-INV-003: Transferir productos entre ubicaciones.
        RN-003, RN-008: Validar stock suficiente.
        """
        # Validar producto
        producto = db.query(Producto).filter(Producto.id == transferencia.producto_id).first()
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID {transferencia.producto_id} no encontrado"
            )
        
        # Validar ubicaciones
        ubicacion_origen = db.query(UbicacionInventario).filter(
            UbicacionInventario.id == transferencia.ubicacion_origen_id
        ).first()
        if not ubicacion_origen:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ubicación origen con ID {transferencia.ubicacion_origen_id} no encontrada"
            )
        
        ubicacion_destino = db.query(UbicacionInventario).filter(
            UbicacionInventario.id == transferencia.ubicacion_destino_id
        ).first()
        if not ubicacion_destino:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ubicación destino con ID {transferencia.ubicacion_destino_id} no encontrada"
            )
        
        # Validar stock suficiente en origen
        stock_origen = InventarioService.get_stock(
            db, transferencia.producto_id, transferencia.ubicacion_origen_id
        )
        if stock_origen < transferencia.cantidad:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Stock insuficiente en {ubicacion_origen.nombre}. Disponible: {stock_origen} unidades"
            )
        
        # Crear movimiento de transferencia
        movimiento = MovimientoInventario(
            producto_id=transferencia.producto_id,
            tipo_movimiento='transferencia',
            cantidad=transferencia.cantidad,
            ubicacion_origen_id=transferencia.ubicacion_origen_id,
            ubicacion_destino_id=transferencia.ubicacion_destino_id,
            motivo=transferencia.motivo or f"Transferencia de {ubicacion_origen.nombre} a {ubicacion_destino.nombre}",
            usuario_id=usuario_id
        )
        db.add(movimiento)
        
        # Actualizar inventario origen (decrementar)
        inv_origen = InventarioService.get_o_crear_inventario(
            db, transferencia.producto_id, transferencia.ubicacion_origen_id
        )
        inv_origen.cantidad -= transferencia.cantidad
        
        # Actualizar inventario destino (incrementar)
        inv_destino = InventarioService.get_o_crear_inventario(
            db, transferencia.producto_id, transferencia.ubicacion_destino_id
        )
        inv_destino.cantidad += transferencia.cantidad
        
        db.commit()
        db.refresh(movimiento)
        return movimiento

    @staticmethod
    def conteo_fisico(
        db: Session,
        conteo: ConteoFisicoRequest,
        usuario_id: int
    ) -> ConteoFisicoResponse:
        """
        FN-INV-004: Registrar conteo físico masivo.
        RN-011: Generar ajustes automáticos por diferencias.
        """
        resultados = []
        ajustes_realizados = 0
        sin_cambios = 0
        
        for item in conteo.conteos:
            # Validar producto existe
            producto = db.query(Producto).filter(Producto.id == item.producto_id).first()
            if not producto:
                resultados.append(ConteoFisicoResultado(
                    producto_id=item.producto_id,
                    ubicacion_id=item.ubicacion_id,
                    cantidad_sistema=0,
                    cantidad_fisica=item.cantidad_fisica,
                    diferencia=0,
                    ajuste_realizado=False
                ))
                continue
            
            # Validar ubicación existe
            ubicacion = db.query(UbicacionInventario).filter(
                UbicacionInventario.id == item.ubicacion_id
            ).first()
            if not ubicacion:
                continue
            
            # Obtener cantidad en sistema
            cantidad_sistema = InventarioService.get_stock(db, item.producto_id, item.ubicacion_id)
            diferencia = item.cantidad_fisica - cantidad_sistema
            
            if diferencia == 0:
                sin_cambios += 1
                resultados.append(ConteoFisicoResultado(
                    producto_id=item.producto_id,
                    ubicacion_id=item.ubicacion_id,
                    cantidad_sistema=cantidad_sistema,
                    cantidad_fisica=item.cantidad_fisica,
                    diferencia=0,
                    ajuste_realizado=False
                ))
                continue
            
            # Crear ajuste
            tipo_movimiento = 'ajuste_positivo' if diferencia > 0 else 'ajuste_negativo'
            movimiento = MovimientoInventario(
                producto_id=item.producto_id,
                tipo_movimiento=tipo_movimiento,
                cantidad=abs(diferencia),
                ubicacion_origen_id=item.ubicacion_id if diferencia < 0 else None,
                ubicacion_destino_id=item.ubicacion_id if diferencia > 0 else None,
                motivo=conteo.motivo,
                usuario_id=usuario_id
            )
            db.add(movimiento)
            
            # Actualizar inventario
            inventario = InventarioService.get_o_crear_inventario(db, item.producto_id, item.ubicacion_id)
            inventario.cantidad = item.cantidad_fisica
            
            ajustes_realizados += 1
            resultados.append(ConteoFisicoResultado(
                producto_id=item.producto_id,
                ubicacion_id=item.ubicacion_id,
                cantidad_sistema=cantidad_sistema,
                cantidad_fisica=item.cantidad_fisica,
                diferencia=diferencia,
                ajuste_realizado=True
            ))
        
        db.commit()
        
        return ConteoFisicoResponse(
            productos_procesados=len(conteo.conteos),
            ajustes_realizados=ajustes_realizados,
            sin_cambios=sin_cambios,
            resultados=resultados
        )

    # ============================================
    # REPORTES DE INVENTARIO
    # ============================================

    @staticmethod
    def get_resumen_inventario(db: Session, sede_id: int, ubicacion_id: Optional[int] = None) -> ResumenInventarioResponse:
        """REP-003: Resumen de inventario por ubicación de una sede"""
        q = db.query(UbicacionInventario).filter(UbicacionInventario.sede_id == sede_id)
        if ubicacion_id:
            q = q.filter(UbicacionInventario.id == ubicacion_id)
        
        ubicaciones = q.filter(UbicacionInventario.estado == 'activo').all()
        
        resumen_ubicaciones = []
        totales = {
            'total_productos': 0,
            'total_unidades': 0,
            'valor_al_costo': Decimal('0'),
            'valor_al_precio_venta': Decimal('0'),
            'productos_stock_bajo': 0,
            'productos_sin_stock': 0
        }
        
        for ubicacion in ubicaciones:
            # Obtener inventarios de esta ubicación
            inventarios = db.query(Inventario).options(
                joinedload(Inventario.producto)
            ).filter(Inventario.ubicacion_id == ubicacion.id).all()
            
            total_productos = len(inventarios)
            total_unidades = sum(inv.cantidad for inv in inventarios)
            valor_al_costo = sum(inv.cantidad * float(inv.producto.precio_compra) for inv in inventarios)
            valor_al_precio_venta = sum(inv.cantidad * float(inv.producto.precio_venta) for inv in inventarios)
            
            # Contar productos con stock bajo y sin stock
            productos_stock_bajo = sum(
                1 for inv in inventarios
                if inv.producto.stock_minimo > 0 and inv.cantidad < inv.producto.stock_minimo
            )
            productos_sin_stock = sum(1 for inv in inventarios if inv.cantidad == 0)
            
            resumen = ResumenInventarioUbicacion(
                ubicacion_id=ubicacion.id,
                ubicacion_nombre=ubicacion.nombre,
                total_productos=total_productos,
                total_unidades=total_unidades,
                valor_al_costo=Decimal(str(valor_al_costo)),
                valor_al_precio_venta=Decimal(str(valor_al_precio_venta)),
                productos_stock_bajo=productos_stock_bajo,
                productos_sin_stock=productos_sin_stock
            )
            resumen_ubicaciones.append(resumen)
            
            # Acumular totales
            totales['total_productos'] += total_productos
            totales['total_unidades'] += total_unidades
            totales['valor_al_costo'] += Decimal(str(valor_al_costo))
            totales['valor_al_precio_venta'] += Decimal(str(valor_al_precio_venta))
            totales['productos_stock_bajo'] += productos_stock_bajo
            totales['productos_sin_stock'] += productos_sin_stock
        
        return ResumenInventarioResponse(
            ubicaciones=resumen_ubicaciones,
            totales=totales
        )


class MovimientoService:
    """Servicio para gestión de movimientos de inventario"""

    # ============================================
    # CONSULTAS DE MOVIMIENTOS
    # ============================================

    @staticmethod
    def get_all_paginado(
        db: Session,
        sede_id: int,
        producto_id: Optional[int] = None,
        tipo_movimiento: Optional[str] = None,
        ubicacion_origen_id: Optional[int] = None,
        ubicacion_destino_id: Optional[int] = None,
        usuario_id: Optional[int] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        referencia: Optional[str] = None,
        pagina: int = 1,
        por_pagina: int = 20
    ) -> Tuple[List[MovimientoInventario], int]:
        """FN-MOV-001: Listar movimientos de una sede con filtros y paginación"""
        q = db.query(MovimientoInventario).join(Producto).filter(Producto.sede_id == sede_id).options(
            joinedload(MovimientoInventario.producto),
            joinedload(MovimientoInventario.ubicacion_origen),
            joinedload(MovimientoInventario.ubicacion_destino),
            joinedload(MovimientoInventario.usuario)
        )
        
        if producto_id:
            q = q.filter(MovimientoInventario.producto_id == producto_id)
        if tipo_movimiento:
            q = q.filter(MovimientoInventario.tipo_movimiento == tipo_movimiento)
        if ubicacion_origen_id:
            q = q.filter(MovimientoInventario.ubicacion_origen_id == ubicacion_origen_id)
        if ubicacion_destino_id:
            q = q.filter(MovimientoInventario.ubicacion_destino_id == ubicacion_destino_id)
        if usuario_id:
            q = q.filter(MovimientoInventario.usuario_id == usuario_id)
        if fecha_desde:
            q = q.filter(MovimientoInventario.fecha_movimiento >= datetime.combine(fecha_desde, datetime.min.time()))
        if fecha_hasta:
            q = q.filter(MovimientoInventario.fecha_movimiento <= datetime.combine(fecha_hasta, datetime.max.time()))
        if referencia:
            q = q.filter(MovimientoInventario.referencia.ilike(f"%{referencia}%"))
        
        total = q.count()
        
        # Ordenar por fecha descendente
        q = q.order_by(desc(MovimientoInventario.fecha_movimiento))
        
        # Paginar
        skip = (pagina - 1) * por_pagina
        movimientos = q.offset(skip).limit(por_pagina).all()
        
        return movimientos, total

    @staticmethod
    def get_by_id(db: Session, movimiento_id: int) -> Optional[MovimientoInventario]:
        """FN-MOV-002: Obtener movimiento por ID"""
        return db.query(MovimientoInventario).options(
            joinedload(MovimientoInventario.producto),
            joinedload(MovimientoInventario.ubicacion_origen),
            joinedload(MovimientoInventario.ubicacion_destino),
            joinedload(MovimientoInventario.usuario)
        ).filter(MovimientoInventario.id == movimiento_id).first()

    @staticmethod
    def get_by_id_or_404(db: Session, movimiento_id: int) -> MovimientoInventario:
        """Obtener movimiento por ID o lanzar 404"""
        movimiento = MovimientoService.get_by_id(db, movimiento_id)
        if not movimiento:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Movimiento con ID {movimiento_id} no encontrado"
            )
        return movimiento

    @staticmethod
    def get_movimientos_producto(
        db: Session,
        producto_id: int,
        tipo_movimiento: Optional[str] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[MovimientoInventario]:
        """FN-PROD-007: Historial de movimientos de un producto"""
        q = db.query(MovimientoInventario).options(
            joinedload(MovimientoInventario.ubicacion_origen),
            joinedload(MovimientoInventario.ubicacion_destino),
            joinedload(MovimientoInventario.usuario)
        ).filter(MovimientoInventario.producto_id == producto_id)
        
        if tipo_movimiento:
            q = q.filter(MovimientoInventario.tipo_movimiento == tipo_movimiento)
        if fecha_desde:
            q = q.filter(MovimientoInventario.fecha_movimiento >= datetime.combine(fecha_desde, datetime.min.time()))
        if fecha_hasta:
            q = q.filter(MovimientoInventario.fecha_movimiento <= datetime.combine(fecha_hasta, datetime.max.time()))
        
        return q.order_by(desc(MovimientoInventario.fecha_movimiento)).offset(skip).limit(limit).all()

    # ============================================
    # REGISTRO DE MOVIMIENTOS
    # ============================================

    @staticmethod
    def validar_movimiento(
        db: Session,
        movimiento: MovimientoCreate
    ) -> None:
        """Validar reglas de negocio para un movimiento"""
        tipo = movimiento.tipo_movimiento.value if hasattr(movimiento.tipo_movimiento, 'value') else movimiento.tipo_movimiento
        
        # Validar producto existe
        producto = db.query(Producto).filter(Producto.id == movimiento.producto_id).first()
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID {movimiento.producto_id} no encontrado"
            )
        
        # Validar ubicaciones según tipo de movimiento
        reqs = UBICACIONES_REQUERIDAS.get(tipo)
        if not reqs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de movimiento '{tipo}' no válido"
            )
        
        if reqs['origen'] and not movimiento.ubicacion_origen_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El tipo de movimiento '{tipo}' requiere ubicación origen"
            )
        
        if reqs['destino'] and not movimiento.ubicacion_destino_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El tipo de movimiento '{tipo}' requiere ubicación destino"
            )
        
        # Validar ubicaciones existen
        if movimiento.ubicacion_origen_id:
            origen = db.query(UbicacionInventario).filter(
                UbicacionInventario.id == movimiento.ubicacion_origen_id
            ).first()
            if not origen:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ubicación origen con ID {movimiento.ubicacion_origen_id} no encontrada"
                )
        
        if movimiento.ubicacion_destino_id:
            destino = db.query(UbicacionInventario).filter(
                UbicacionInventario.id == movimiento.ubicacion_destino_id
            ).first()
            if not destino:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Ubicación destino con ID {movimiento.ubicacion_destino_id} no encontrada"
            )
        
        # RN-001: Validar stock suficiente para decrementos
        if tipo in TIPOS_DECREMENTO or tipo == 'transferencia':
            ubicacion_id = movimiento.ubicacion_origen_id
            stock_actual = InventarioService.get_stock(db, movimiento.producto_id, ubicacion_id)
            
            if stock_actual < movimiento.cantidad:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Stock insuficiente. Disponible: {stock_actual} unidades"
                )

    @staticmethod
    def crear_movimiento(
        db: Session,
        movimiento: MovimientoCreate,
        usuario_id: int
    ) -> MovimientoInventario:
        """
        FN-MOV-003: Registrar movimiento manual.
        Actualiza inventario automáticamente.
        """
        # Validar movimiento
        MovimientoService.validar_movimiento(db, movimiento)
        
        tipo = movimiento.tipo_movimiento.value if hasattr(movimiento.tipo_movimiento, 'value') else movimiento.tipo_movimiento
        
        # Crear movimiento
        movimiento_data = movimiento.model_dump()
        movimiento_data['tipo_movimiento'] = tipo
        movimiento_data['usuario_id'] = usuario_id
        
        # Calcular costo total si hay costo unitario
        if movimiento.costo_unitario and not movimiento.costo_total:
            movimiento_data['costo_total'] = movimiento.costo_unitario * movimiento.cantidad
        
        db_movimiento = MovimientoInventario(**movimiento_data)
        db.add(db_movimiento)
        
        # Actualizar inventario según tipo
        if tipo in TIPOS_INCREMENTO:
            inv = InventarioService.get_o_crear_inventario(
                db, movimiento.producto_id, movimiento.ubicacion_destino_id
            )
            inv.cantidad += movimiento.cantidad
        
        elif tipo in TIPOS_DECREMENTO:
            inv = InventarioService.get_o_crear_inventario(
                db, movimiento.producto_id, movimiento.ubicacion_origen_id
            )
            inv.cantidad -= movimiento.cantidad
        
        elif tipo == 'transferencia':
            # Decrementar origen
            inv_origen = InventarioService.get_o_crear_inventario(
                db, movimiento.producto_id, movimiento.ubicacion_origen_id
            )
            inv_origen.cantidad -= movimiento.cantidad
            
            # Incrementar destino
            inv_destino = InventarioService.get_o_crear_inventario(
                db, movimiento.producto_id, movimiento.ubicacion_destino_id
            )
            inv_destino.cantidad += movimiento.cantidad
        
        db.commit()
        db.refresh(db_movimiento)
        return db_movimiento

    @staticmethod
    def registrar_compra(
        db: Session,
        compra: CompraRequest,
        usuario_id: int
    ) -> MovimientoInventario:
        """
        FN-MOV-004: Endpoint simplificado para registrar compras.
        """
        movimiento_data = MovimientoCreate(
            producto_id=compra.producto_id,
            tipo_movimiento=TipoMovimiento.COMPRA,
            cantidad=compra.cantidad,
            ubicacion_destino_id=compra.ubicacion_destino_id,
            costo_unitario=compra.costo_unitario,
            costo_total=compra.costo_unitario * compra.cantidad,
            referencia=compra.referencia,
            motivo=compra.motivo
        )
        
        return MovimientoService.crear_movimiento(db, movimiento_data, usuario_id)

    @staticmethod
    def anular_movimiento(
        db: Session,
        movimiento_id: int,
        motivo: str,
        usuario_id: int
    ) -> MovimientoInventario:
        """
        FN-MOV-005: Anular movimiento creando movimiento inverso.
        RN-006: No eliminar, crear movimiento inverso.
        """
        movimiento_original = MovimientoService.get_by_id_or_404(db, movimiento_id)
        
        # No se pueden anular ventas (deben anularse desde POS)
        if movimiento_original.tipo_movimiento == 'venta':
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Los movimientos de venta deben anularse desde el Punto de Venta"
            )
        
        # Determinar tipo de movimiento inverso
        tipo_original = movimiento_original.tipo_movimiento
        if tipo_original in TIPOS_INCREMENTO:
            tipo_inverso = 'ajuste_negativo'
            ubicacion_origen = movimiento_original.ubicacion_destino_id
            ubicacion_destino = None
        elif tipo_original in TIPOS_DECREMENTO:
            tipo_inverso = 'ajuste_positivo'
            ubicacion_origen = None
            ubicacion_destino = movimiento_original.ubicacion_origen_id
        elif tipo_original == 'transferencia':
            # Invertir la transferencia
            tipo_inverso = 'transferencia'
            ubicacion_origen = movimiento_original.ubicacion_destino_id
            ubicacion_destino = movimiento_original.ubicacion_origen_id
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"No se puede anular movimiento de tipo '{tipo_original}'"
            )
        
        # Validar stock para movimientos que decrementan
        if tipo_inverso in TIPOS_DECREMENTO or (tipo_inverso == 'transferencia' and ubicacion_origen):
            stock = InventarioService.get_stock(db, movimiento_original.producto_id, ubicacion_origen)
            if stock < movimiento_original.cantidad:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"No hay stock suficiente para anular. Disponible: {stock}"
                )
        
        # Crear movimiento inverso
        movimiento_inverso = MovimientoInventario(
            producto_id=movimiento_original.producto_id,
            tipo_movimiento=tipo_inverso,
            cantidad=movimiento_original.cantidad,
            ubicacion_origen_id=ubicacion_origen,
            ubicacion_destino_id=ubicacion_destino,
            costo_unitario=movimiento_original.costo_unitario,
            costo_total=movimiento_original.costo_total,
            motivo=f"ANULACIÓN de movimiento #{movimiento_id}: {motivo}",
            referencia=f"ANULA-{movimiento_id}",
            usuario_id=usuario_id
        )
        db.add(movimiento_inverso)
        
        # Actualizar inventario
        if tipo_inverso in TIPOS_INCREMENTO:
            inv = InventarioService.get_o_crear_inventario(
                db, movimiento_original.producto_id, ubicacion_destino
            )
            inv.cantidad += movimiento_original.cantidad
        elif tipo_inverso in TIPOS_DECREMENTO:
            inv = InventarioService.get_o_crear_inventario(
                db, movimiento_original.producto_id, ubicacion_origen
            )
            inv.cantidad -= movimiento_original.cantidad
        elif tipo_inverso == 'transferencia':
            inv_origen = InventarioService.get_o_crear_inventario(
                db, movimiento_original.producto_id, ubicacion_origen
            )
            inv_origen.cantidad -= movimiento_original.cantidad
            
            inv_destino = InventarioService.get_o_crear_inventario(
                db, movimiento_original.producto_id, ubicacion_destino
            )
            inv_destino.cantidad += movimiento_original.cantidad
        
        db.commit()
        db.refresh(movimiento_inverso)
        return movimiento_inverso


class OperacionesMasivasService:
    """Servicio para operaciones masivas"""

    @staticmethod
    def actualizar_precios_masivo(
        db: Session,
        request: ActualizarPreciosMasivoRequest
    ) -> ActualizarPreciosResponse:
        """
        FN-MAS-001: Actualizar precios de múltiples productos.
        RN-013: Operaciones masivas de precios.
        """
        resultados = []
        productos_actualizados = 0
        errores = 0
        
        for producto_id in request.productos_ids:
            producto = db.query(Producto).filter(Producto.id == producto_id).first()
            
            if not producto:
                resultados.append(ActualizarPreciosResultado(
                    producto_id=producto_id,
                    producto_nombre="No encontrado",
                    precio_compra_anterior=None,
                    precio_compra_nuevo=None,
                    precio_venta_anterior=None,
                    precio_venta_nuevo=None,
                    actualizado=False,
                    error=f"Producto con ID {producto_id} no encontrado"
                ))
                errores += 1
                continue
            
            precio_compra_anterior = producto.precio_compra
            precio_venta_anterior = producto.precio_venta
            precio_compra_nuevo = precio_compra_anterior
            precio_venta_nuevo = precio_venta_anterior
            error_msg = None
            
            try:
                # Calcular nuevos precios
                if request.incremento_porcentaje is not None:
                    factor = Decimal(str(1 + request.incremento_porcentaje / 100))
                    if request.aplicar_a_compra:
                        precio_compra_nuevo = precio_compra_anterior * factor
                    if request.aplicar_a_venta:
                        precio_venta_nuevo = precio_venta_anterior * factor
                
                if request.incremento_fijo is not None:
                    if request.aplicar_a_compra:
                        precio_compra_nuevo = precio_compra_nuevo + request.incremento_fijo
                    if request.aplicar_a_venta:
                        precio_venta_nuevo = precio_venta_nuevo + request.incremento_fijo
                
                # Validar que no queden negativos
                if precio_compra_nuevo < 0:
                    raise ValueError("El precio de compra no puede ser negativo")
                if precio_venta_nuevo < 0:
                    raise ValueError("El precio de venta no puede ser negativo")
                
                # Actualizar
                if request.aplicar_a_compra:
                    producto.precio_compra = precio_compra_nuevo
                if request.aplicar_a_venta:
                    producto.precio_venta = precio_venta_nuevo
                
                productos_actualizados += 1
                
            except ValueError as e:
                error_msg = str(e)
                errores += 1
            
            resultados.append(ActualizarPreciosResultado(
                producto_id=producto_id,
                producto_nombre=producto.nombre,
                precio_compra_anterior=precio_compra_anterior if request.aplicar_a_compra else None,
                precio_compra_nuevo=precio_compra_nuevo if request.aplicar_a_compra and not error_msg else None,
                precio_venta_anterior=precio_venta_anterior if request.aplicar_a_venta else None,
                precio_venta_nuevo=precio_venta_nuevo if request.aplicar_a_venta and not error_msg else None,
                actualizado=error_msg is None,
                error=error_msg
            ))
        
        db.commit()
        
        return ActualizarPreciosResponse(
            productos_actualizados=productos_actualizados,
            errores=errores,
            resultados=resultados
        )
