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
    def ventas_periodo(db: Session, sede_id: int, fecha_inicio: date, fecha_fin: date) -> dict:
        """Obtiene ventas de una sede por período"""
        dt_inicio = datetime.combine(fecha_inicio, datetime.min.time())
        dt_fin = datetime.combine(fecha_fin, datetime.max.time())
        
        result = db.query(
            func.count(Factura.id).label('total_facturas'),
            func.sum(Factura.total).label('total_ventas')
        ).filter(
            Factura.sede_id == sede_id,
            Factura.fecha >= dt_inicio,
            Factura.fecha <= dt_fin,
            Factura.estado == 'pagada'
        ).first()
        
        total_facturas = result.total_facturas or 0
        total_ventas = Decimal(str(result.total_ventas or 0))
        promedio = total_ventas / total_facturas if total_facturas > 0 else Decimal(0)
        
        metodos = VentasService.ventas_por_metodo_pago(db, sede_id, fecha_inicio, fecha_fin)
        
        return {
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'total_facturas': total_facturas,
            'total_ventas': total_ventas,
            'promedio_ticket': round(promedio, 2),
            'metodos_pago': metodos
        }
    
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
