"""
Servicio para cálculo de comisiones

Calcula las comisiones de especialistas basándose en:
- Servicios: Comisión configurada en la tabla especialista_servicios o en servicios
- Productos: Porcentaje de comisión configurado en el producto
"""
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional
from datetime import datetime, time, date

# No top-level imports of Models to avoid circular dependencies


class ComisionCalculator:
    """Calculador de comisiones para especialistas"""
    
    @staticmethod
    def calcular_comision_servicio(
        db: Session,
        servicio_id: int,
        especialista_id: int,
        precio_venta: Decimal
    ) -> dict:
        """
        Calcula la comisión de un servicio.
        
        Prioridad:
        1. Comisión específica en especialista_servicios
        2. Comisión por defecto del servicio
        
        Returns:
            dict con tipo_comision, valor_comision y monto_comision
        """
        from ..models.especialista import EspecialistaServicio
        from ..models.servicio import Servicio
        
        # Buscar comisión específica del especialista
        esp_servicio = db.query(EspecialistaServicio).filter(
            EspecialistaServicio.especialista_id == especialista_id,
            EspecialistaServicio.servicio_id == servicio_id
        ).first()
        
        if esp_servicio:
            tipo = esp_servicio.tipo_comision
            valor = Decimal(str(esp_servicio.valor_comision))
        else:
            # Usar comisión por defecto del servicio
            servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
            if not servicio:
                return {
                    'tipo_comision': None,
                    'valor_comision': Decimal(0),
                    'monto_comision': Decimal(0)
                }
            tipo = servicio.tipo_comision or 'porcentaje'
            valor = Decimal(str(servicio.valor_comision or 0))
        
        # Calcular monto
        if tipo == 'porcentaje':
            monto = (precio_venta * valor) / 100
        else:  # fijo
            monto = valor
        
        return {
            'tipo_comision': tipo,
            'valor_comision': valor,
            'monto_comision': round(monto, 2)
        }
    
    @staticmethod
    def calcular_comision_producto(
        db: Session,
        producto_id: int,
        precio_venta: Decimal,
        cantidad: Decimal = Decimal(1)
    ) -> dict:
        """
        Calcula la comisión de un producto.
        
        Usa el porcentaje de comisión configurado en el producto.
        
        Returns:
            dict con tipo_comision, valor_comision y monto_comision
        """
        from ..models.producto import Producto
        
        producto = db.query(Producto).filter(Producto.id == producto_id).first()
        
        if not producto:
            return {
                'tipo_comision': 'porcentaje',
                'valor_comision': Decimal(0),
                'monto_comision': Decimal(0)
            }
        
        # Usar comision_venta o comision_porcentaje (alias)
        porcentaje = Decimal(str(producto.comision_venta or producto.comision_porcentaje or 0))
        
        if porcentaje <= 0:
            return {
                'tipo_comision': 'porcentaje',
                'valor_comision': Decimal(0),
                'monto_comision': Decimal(0)
            }
        subtotal = precio_venta * cantidad
        monto = (subtotal * porcentaje) / 100
        
        return {
            'tipo_comision': 'porcentaje',
            'valor_comision': porcentaje,
            'monto_comision': round(monto, 2)
        }
    
    @staticmethod
    def calcular_comision_detalle(
        db: Session,
        tipo: str,
        item_id: int,
        especialista_id: int,
        precio_unitario: Decimal,
        cantidad: Decimal = Decimal(1),
        descuento_linea: Decimal = Decimal(0)
    ) -> dict:
        """
        Calcula la comisión para una línea de detalle de factura.
        
        Args:
            tipo: 'servicio' o 'producto'
            item_id: ID del servicio o producto
            especialista_id: ID del especialista que realizó la venta/servicio
            precio_unitario: Precio unitario del ítem
            cantidad: Cantidad vendida
            descuento_linea: Descuento aplicado a la línea
            
        Returns:
            dict con información de la comisión
        """
        # Calcular precio neto (precio - descuento)
        subtotal = (precio_unitario * cantidad) - descuento_linea
        
        if tipo == 'servicio':
            return ComisionCalculator.calcular_comision_servicio(
                db, item_id, especialista_id, subtotal
            )
        else:  # producto
            return ComisionCalculator.calcular_comision_producto(
                db, item_id, precio_unitario, cantidad
            )


class ComisionService:
    """Servicio para gestión de comisiones"""
    
    @staticmethod
    def calcular_comisiones_factura(db: Session, factura_id: int) -> list:
        """
        Calcula las comisiones de todas las líneas de una factura.
        
        Returns:
            Lista de dicts con las comisiones por línea
        """
        from ..models.caja import DetalleFactura
        
        detalles = db.query(DetalleFactura).filter(
            DetalleFactura.factura_id == factura_id
        ).all()
        
        comisiones = []
        
        for detalle in detalles:
            if not detalle.especialista_id:
                continue
            
            comision = ComisionCalculator.calcular_comision_detalle(
                db=db,
                tipo=detalle.tipo,
                item_id=detalle.item_id,
                especialista_id=detalle.especialista_id,
                precio_unitario=Decimal(str(detalle.precio_unitario)),
                cantidad=Decimal(str(detalle.cantidad)),
                descuento_linea=Decimal(str(detalle.descuento_linea or 0))
            )
            
            comisiones.append({
                'detalle_factura_id': detalle.id,
                'especialista_id': detalle.especialista_id,
                'tipo': detalle.tipo,
                'item_id': detalle.item_id,
                'subtotal_linea': detalle.subtotal,
                **comision
            })
        
        return comisiones
    
    @staticmethod
    def get_resumen_comisiones_por_especialista(
        db: Session,
        factura_id: int
    ) -> dict:
        """
        Resume las comisiones de una factura agrupadas por especialista.
        
        Returns:
            Dict con especialista_id como clave y total de comisión como valor
        """
        comisiones = ComisionService.calcular_comisiones_factura(db, factura_id)
        
        resumen = {}
        for c in comisiones:
            esp_id = c['especialista_id']
            if esp_id not in resumen:
                resumen[esp_id] = {
                    'especialista_id': esp_id,
                    'total_comision': Decimal(0),
                    'detalle': []
                }
            resumen[esp_id]['total_comision'] += c['monto_comision']
            resumen[esp_id]['detalle'].append(c)
        
        return resumen

    @staticmethod
    def get_comisiones_periodo(
        db: Session,
        especialista_id: int,
        fecha_desde,
        fecha_hasta
    ) -> dict:
        """
        Calcula las comisiones de un especialista en un período (Optimizado).
        """
        from ..models.caja import Factura, DetalleFactura
        from ..models.servicio import Servicio
        from ..models.producto import Producto
        from sqlalchemy.orm import joinedload

        # Convertir fechas a datetimes para cubrir el día completo
        start_dt = datetime.combine(fecha_desde, time.min) if isinstance(fecha_desde, date) else fecha_desde
        end_dt = datetime.combine(fecha_hasta, time.max) if isinstance(fecha_hasta, date) else fecha_hasta

        # Consultar directamente las líneas de detalle del especialista vinculadas a facturas pagadas
        detalles = db.query(DetalleFactura).join(Factura).options(
            joinedload(DetalleFactura.factura)
        ).filter(
            DetalleFactura.especialista_id == especialista_id,
            Factura.estado == 'pagada',
            Factura.fecha >= start_dt,
            Factura.fecha <= end_dt
        ).order_by(Factura.fecha.desc()).all()
        
        # Pre-cargar nombres de servicios y productos para evitar N+1
        servicio_ids = {d.item_id for d in detalles if d.tipo == 'servicio'}
        producto_ids = {d.item_id for d in detalles if d.tipo == 'producto'}
        
        servicios_map = {s.id: s.nombre for s in db.query(Servicio).filter(Servicio.id.in_(servicio_ids)).all()} if servicio_ids else {}
        productos_map = {p.id: p.nombre for p in db.query(Producto).filter(Producto.id.in_(producto_ids)).all()} if producto_ids else {}

        total_servicios = Decimal(0)
        total_productos = Decimal(0)
        total_comision = Decimal(0)
        detalle_resumen = []
        
        for df in detalles:
            comision = ComisionCalculator.calcular_comision_detalle(
                db=db,
                tipo=df.tipo,
                item_id=df.item_id,
                especialista_id=df.especialista_id,
                precio_unitario=Decimal(str(df.precio_unitario)),
                cantidad=Decimal(str(df.cantidad)),
                descuento_linea=Decimal(str(df.descuento_linea or 0))
            )
            
            monto_comision = comision['monto_comision']
            if df.tipo == 'servicio':
                total_servicios += monto_comision
                item_nombre = servicios_map.get(df.item_id, f"Servicio #{df.item_id}")
            else:
                total_productos += monto_comision
                item_nombre = productos_map.get(df.item_id, f"Producto #{df.item_id}")
            
            total_comision += monto_comision
            
            detalle_resumen.append({
                'factura_id': df.factura_id,
                'factura_numero': df.factura.numero_factura,
                'fecha': df.factura.fecha,
                'tipo': df.tipo,
                'item_id': df.item_id,
                'item_nombre': item_nombre,
                'cantidad': float(df.cantidad),
                'precio_unitario': float(df.precio_unitario),
                'subtotal_linea': float(df.subtotal or 0),
                'tipo_comision': comision['tipo_comision'],
                'valor_comision': float(comision['valor_comision']),
                'monto_comision': float(monto_comision)
            })
        
        return {
            'especialista_id': especialista_id,
            'fecha_desde': fecha_desde,
            'fecha_hasta': fecha_hasta,
            'total_servicios': total_servicios,
            'total_productos': total_productos,
            'total_comision': total_comision,
            'cantidad_items': len(detalle_resumen),
            'detalle': detalle_resumen
        }
