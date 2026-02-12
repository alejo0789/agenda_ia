"""
Servicio de negocio para Ventas y Reportes
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, case
from typing import Optional
from datetime import datetime, date
from decimal import Decimal

from ..models.caja import Factura, DetalleFactura, PagoFactura, MetodoPago


class VentasService:
    """Servicio para consultas de ventas y reportes"""
    
    @staticmethod
    def ventas_dia(db: Session, sede_id: int, fecha: Optional[date] = None) -> dict:
        """Obtiene las ventas del día de una sede"""
        if not fecha:
            fecha = date.today()
        
        fecha_inicio = datetime.combine(fecha, datetime.min.time())
        fecha_fin = datetime.combine(fecha, datetime.max.time())
        
        # Total facturas y ventas
        result = db.query(
            func.count(Factura.id).label('total_facturas'),
            func.sum(Factura.total).label('total_ventas')
        ).filter(
            Factura.sede_id == sede_id,
            Factura.fecha >= fecha_inicio,
            Factura.fecha <= fecha_fin,
            Factura.estado == 'pagada'
        ).first()
        
        total_facturas = result.total_facturas or 0
        total_ventas = Decimal(str(result.total_ventas or 0))
        
        # Total por tipo
        detalle = db.query(
            func.sum(case((DetalleFactura.tipo == 'servicio', DetalleFactura.subtotal), else_=0)).label('servicios'),
            func.sum(case((DetalleFactura.tipo == 'producto', DetalleFactura.subtotal), else_=0)).label('productos')
        ).join(Factura).filter(
            Factura.sede_id == sede_id,
            Factura.fecha >= fecha_inicio,
            Factura.fecha <= fecha_fin,
            Factura.estado == 'pagada'
        ).first()
        
        total_servicios = Decimal(str(detalle.servicios or 0))
        total_productos = Decimal(str(detalle.productos or 0))
        
        # Por método de pago
        pagos = db.query(
            MetodoPago.nombre,
            func.sum(PagoFactura.monto).label('total')
        ).join(MetodoPago).join(Factura).filter(
            Factura.sede_id == sede_id,
            Factura.fecha >= fecha_inicio,
            Factura.fecha <= fecha_fin,
            Factura.estado == 'pagada'
        ).group_by(MetodoPago.nombre).all()
        
        total_efectivo = Decimal(0)
        total_tarjeta = Decimal(0)
        total_otros = Decimal(0)
        
        for nombre, total in pagos:
            monto = Decimal(str(total or 0))
            if 'efectivo' in nombre.lower():
                total_efectivo += monto
            elif 'tarjeta' in nombre.lower():
                total_tarjeta += monto
            else:
                total_otros += monto
        
        return {
            'fecha': fecha,
            'total_facturas': total_facturas,
            'total_ventas': total_ventas,
            'total_servicios': total_servicios,
            'total_productos': total_productos,
            'total_efectivo': total_efectivo,
            'total_tarjeta': total_tarjeta,
            'total_otros_metodos': total_otros
        }
    
    @staticmethod
    def ventas_periodo(db: Session, sede_id: int, fecha_inicio: date, fecha_fin: date) -> list:
        """Obtiene ventas diarias en un período"""
        dt_inicio = datetime.combine(fecha_inicio, datetime.min.time())
        dt_fin = datetime.combine(fecha_fin, datetime.max.time())
        
        # 1. Agrupar facturas por día
        query = db.query(
            func.date(Factura.fecha).label('fecha'),
            func.count(Factura.id).label('cantidad_facturas'),
            func.sum(Factura.total).label('total_ventas')
        ).filter(
            Factura.sede_id == sede_id,
            Factura.fecha >= dt_inicio,
            Factura.fecha <= dt_fin,
            Factura.estado == 'pagada'
        ).group_by(func.date(Factura.fecha)).order_by(func.date(Factura.fecha))
        
        resultados_generales = query.all()
        
        # 2. Agrupar detalle por día para separar servicios y productos
        query_detalle = db.query(
            func.date(Factura.fecha).label('fecha'),
            func.sum(case((DetalleFactura.tipo == 'servicio', DetalleFactura.subtotal), else_=0)).label('servicios'),
            func.sum(case((DetalleFactura.tipo == 'producto', DetalleFactura.subtotal), else_=0)).label('productos')
        ).select_from(DetalleFactura).join(Factura).filter(
            Factura.sede_id == sede_id,
            Factura.fecha >= dt_inicio,
            Factura.fecha <= dt_fin,
            Factura.estado == 'pagada'
        ).group_by(func.date(Factura.fecha))
        
        resultados_detalle = query_detalle.all()
        
        # Mapear detalle por fecha para acceso rápido
        detalles_map = {
            str(r.fecha): {'servicios': r.servicios, 'productos': r.productos} 
            for r in resultados_detalle
        }
        
        lista_ventas = []
        
        for r in resultados_generales:
            fecha_str = str(r.fecha)
            det = detalles_map.get(fecha_str, {'servicios': 0, 'productos': 0})
            
            # TODO: Calcular facturas anuladas si es necesario
            
            lista_ventas.append({
                'fecha': r.fecha, # Pydantic serializará date
                'cantidad_facturas': r.cantidad_facturas,
                'cantidad_facturas_anuladas': 0, # Placeholder
                'total_ventas': float(r.total_ventas or 0),
                'total_servicios': float(det['servicios'] or 0),
                'total_productos': float(det['productos'] or 0)
            })
            
        return lista_ventas
    
    @staticmethod
    def ventas_por_metodo_pago(db: Session, sede_id: int, fecha_inicio: date = None, fecha_fin: date = None) -> list:
        """Resumen por método de pago de una sede"""
        if not fecha_inicio:
            fecha_inicio = date.today()
        if not fecha_fin:
            fecha_fin = date.today()
        
        dt_inicio = datetime.combine(fecha_inicio, datetime.min.time())
        dt_fin = datetime.combine(fecha_fin, datetime.max.time())
        
        query = db.query(
            MetodoPago.id,
            MetodoPago.nombre,
            func.count(PagoFactura.id).label('transacciones'),
            func.sum(PagoFactura.monto).label('monto')
        ).join(MetodoPago).join(Factura).filter(
            Factura.sede_id == sede_id,
            Factura.fecha >= dt_inicio,
            Factura.fecha <= dt_fin,
            Factura.estado == 'pagada'
        ).group_by(MetodoPago.id, MetodoPago.nombre)
        
        return [{
            'metodo_pago_id': r.id,
            'metodo_pago_nombre': r.nombre,
            'total_transacciones': r.transacciones,
            'monto_total': Decimal(str(r.monto or 0))
        } for r in query.all()]
