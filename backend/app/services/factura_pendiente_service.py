"""
Servicio de negocio para Facturas Pendientes

Incluye:
- Creación de servicios pendientes (app móvil)
- Listado y resumen por cliente
- Aprobación y rechazo
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from fastapi import HTTPException, status

from ..models.caja import FacturaPendiente
from ..models.servicio import Servicio
from ..models.producto import Producto
from ..models.cliente import Cliente
from ..models.especialista import Especialista
from ..schemas.caja import FacturaPendienteCreate


class FacturaPendienteService:
    """Servicio para gestión de facturas pendientes (app móvil)"""
    
    @staticmethod
    def crear_pendiente(
        db: Session,
        data: FacturaPendienteCreate,
        especialista_id: int,
        sede_id: int
    ) -> FacturaPendiente:
        """Crea un servicio pendiente registrado por especialista"""
        # Validar que el servicio existe
        servicio = db.query(Servicio).filter(Servicio.id == data.servicio_id).first()
        if not servicio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Servicio {data.servicio_id} no encontrado"
            )
        
        # Validar cliente si se proporciona
        if data.cliente_id:
            cliente = db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
            if not cliente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Cliente {data.cliente_id} no encontrado"
                )
        
        pendiente = FacturaPendiente(
            especialista_id=especialista_id,
            cliente_id=data.cliente_id,
            sede_id=sede_id,
            servicio_id=data.servicio_id,
            fecha_servicio=data.fecha_servicio,
            notas=data.notas,
            estado='pendiente'
        )
        
        db.add(pendiente)
        db.commit()
        db.refresh(pendiente)
        
        return pendiente
    
    @staticmethod
    def get_by_id(db: Session, pendiente_id: int) -> Optional[FacturaPendiente]:
        """Obtiene un servicio pendiente por ID"""
        return db.query(FacturaPendiente).filter(FacturaPendiente.id == pendiente_id).first()
    
    @staticmethod
    def get_all(
        db: Session,
        sede_id: int,
        estado: Optional[str] = None,
        especialista_id: Optional[int] = None,
        cliente_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[FacturaPendiente]:
        """Obtiene todos los servicios pendientes de una sede con filtros"""
        query = db.query(FacturaPendiente).filter(FacturaPendiente.sede_id == sede_id)
        
        if estado and estado != 'todos':
            query = query.filter(FacturaPendiente.estado == estado)
        if especialista_id:
            query = query.filter(FacturaPendiente.especialista_id == especialista_id)
        if cliente_id:
            query = query.filter(FacturaPendiente.cliente_id == cliente_id)
        
        return query.order_by(FacturaPendiente.fecha_creacion.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_resumen_por_cliente(
        db: Session, 
        sede_id: int, 
        cliente_id: Optional[int] = None,
        fecha_inicio: Optional[datetime.date] = None,
        fecha_fin: Optional[datetime.date] = None
    ) -> List[dict]:
        """Obtiene resumen de servicios pendientes de la sede agrupados por cliente"""
        query = db.query(
            FacturaPendiente.cliente_id,
            func.count(FacturaPendiente.id).label('total_servicios')
        ).filter(and_(FacturaPendiente.estado.in_(['pendiente', 'aprobada']), FacturaPendiente.sede_id == sede_id))
        
        if cliente_id:
            query = query.filter(FacturaPendiente.cliente_id == cliente_id)
        
        if fecha_inicio:
            query = query.filter(FacturaPendiente.fecha_servicio >= fecha_inicio)
        if fecha_fin:
            query = query.filter(FacturaPendiente.fecha_servicio <= fecha_fin)
        
        query = query.group_by(FacturaPendiente.cliente_id)
        
        resumen = []
        for cid, total in query.all():
            # Obtener nombre del cliente
            cliente = db.query(Cliente).filter(Cliente.id == cid).first() if cid else None
            cliente_nombre = "Sin cliente"
            if cliente:
                cliente_nombre = f"{cliente.nombre} {cliente.apellido or ''}".strip()
            
            # Obtener servicios y productos detallados de la sede específica
            item_query = db.query(FacturaPendiente)\
                .filter(
                    FacturaPendiente.cliente_id == cid,
                    FacturaPendiente.estado.in_(['pendiente', 'aprobada']),
                    FacturaPendiente.sede_id == sede_id
                )
            
            if fecha_inicio:
                item_query = item_query.filter(FacturaPendiente.fecha_servicio >= fecha_inicio)
            if fecha_fin:
                item_query = item_query.filter(FacturaPendiente.fecha_servicio <= fecha_fin)
            
            items = item_query.all()
            
            # Calcular total
            total_monto = Decimal(0)
            items_response = []
            for item_pendiente in items:
                nombre = ""
                precio = Decimal(0)
                
                if item_pendiente.tipo == 'producto':
                    producto = db.query(Producto).filter(Producto.id == item_pendiente.producto_id).first()
                    if producto:
                        nombre = producto.nombre
                        precio = Decimal(str(producto.precio_venta))
                else: # servicio
                    servicio = db.query(Servicio).filter(Servicio.id == item_pendiente.servicio_id).first()
                    if servicio:
                        nombre = servicio.nombre
                        precio = Decimal(str(servicio.precio_base))
                
                cantidad = Decimal(str(item_pendiente.cantidad or 1))
                item_total = precio * cantidad
                total_monto += item_total
                
                especialista = db.query(Especialista).filter(Especialista.id == item_pendiente.especialista_id).first()
                especialista_nombre = f"{especialista.nombre} {especialista.apellido}".strip() if especialista else ""
                
                items_response.append({
                    'id': item_pendiente.id,
                    'especialista_id': item_pendiente.especialista_id,
                    'especialista_nombre': especialista_nombre,
                    'cliente_id': item_pendiente.cliente_id,
                    'cliente_nombre': cliente_nombre,
                    'tipo': item_pendiente.tipo,
                    'servicio_id': item_pendiente.servicio_id,
                    'producto_id': item_pendiente.producto_id,
                    'servicio_nombre': nombre, # Mantenemos nombre de campo por compatibilidad frontend
                    'servicio_precio': precio, # Mantenemos nombre de campo por compatibilidad frontend
                    'cantidad': float(cantidad),
                    'fecha_servicio': item_pendiente.fecha_servicio,
                    'notas': item_pendiente.notas,
                    'estado': item_pendiente.estado,
                    'fecha_creacion': item_pendiente.fecha_creacion
                })
            
            resumen.append({
                'cliente_id': cid,
                'cliente_nombre': cliente_nombre,
                'total_servicios': total, # Representa total de items
                'total_monto': total_monto,
                'servicios': items_response # Mantenemos nombre de campo por compatibilidad frontend
            })
        
        return resumen
    
    @staticmethod
    def aprobar_pendiente(db: Session, pendiente_id: int, usuario_id: int) -> FacturaPendiente:
        """Aprueba un servicio pendiente (sin facturar aún)"""
        pendiente = FacturaPendienteService.get_by_id(db, pendiente_id)
        
        if not pendiente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio pendiente no encontrado"
            )
        
        if pendiente.estado != 'pendiente':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El servicio ya fue procesado"
            )
        
        pendiente.estado = 'aprobada'
        pendiente.revisado_por = usuario_id
        pendiente.fecha_revision = datetime.now()
        
        db.commit()
        db.refresh(pendiente)
        
        return pendiente
    
    @staticmethod
    def rechazar_pendiente(
        db: Session,
        pendiente_id: int,
        motivo: str,
        usuario_id: int
    ) -> FacturaPendiente:
        """Rechaza un servicio pendiente"""
        pendiente = FacturaPendienteService.get_by_id(db, pendiente_id)
        
        if not pendiente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio pendiente no encontrado"
            )
        
        if pendiente.estado != 'pendiente':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El servicio ya fue procesado"
            )
        
        pendiente.estado = 'rechazada'
        pendiente.revisado_por = usuario_id
        pendiente.fecha_revision = datetime.now()
        pendiente.motivo_rechazo = motivo
        
        db.commit()
        db.refresh(pendiente)
        
        return pendiente
    
    @staticmethod
    def get_detalle_completo(db: Session, pendiente_id: int) -> Optional[dict]:
        """Obtiene el detalle completo de un servicio pendiente"""
        pendiente = FacturaPendienteService.get_by_id(db, pendiente_id)
        if not pendiente:
            return None
        
        nombre = ""
        precio = Decimal(0)
        
        if pendiente.tipo == 'producto':
            producto = db.query(Producto).filter(Producto.id == pendiente.producto_id).first()
            if producto:
                nombre = producto.nombre
                precio = Decimal(str(producto.precio_venta))
        else:
            servicio = db.query(Servicio).filter(Servicio.id == pendiente.servicio_id).first()
            if servicio:
                nombre = servicio.nombre
                precio = Decimal(str(servicio.precio_base))
        
        cliente = db.query(Cliente).filter(Cliente.id == pendiente.cliente_id).first() if pendiente.cliente_id else None
        especialista = db.query(Especialista).filter(Especialista.id == pendiente.especialista_id).first()
        
        return {
            'id': pendiente.id,
            'especialista_id': pendiente.especialista_id,
            'especialista_nombre': f"{especialista.nombre} {especialista.apellido}".strip() if especialista else "",
            'cliente_id': pendiente.cliente_id,
            'cliente_nombre': f"{cliente.nombre} {cliente.apellido or ''}".strip() if cliente else None,
            'tipo': pendiente.tipo,
            'servicio_id': pendiente.servicio_id,
            'producto_id': pendiente.producto_id,
            'servicio_nombre': nombre,
            'servicio_precio': precio,
            'cantidad': float(pendiente.cantidad or 1),
            'fecha_servicio': pendiente.fecha_servicio,
            'notas': pendiente.notas,
            'estado': pendiente.estado,
            'fecha_creacion': pendiente.fecha_creacion
        }
