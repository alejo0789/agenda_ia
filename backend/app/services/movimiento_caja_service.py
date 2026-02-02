"""
Servicio de negocio para Movimientos de Caja

Incluye:
- Registro de ingresos/egresos manuales
- Listado de movimientos
- Resumen de movimientos
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from fastapi import HTTPException, status

from ..models.caja import MovimientoCaja, Caja
from ..models.user import Usuario
from ..schemas.caja import MovimientoCajaCreate


class MovimientoCajaService:
    """Servicio para gestión de movimientos de caja"""
    
    @staticmethod
    def registrar_movimiento(
        db: Session,
        caja_id: int,
        data: MovimientoCajaCreate,
        usuario_id: int
    ) -> MovimientoCaja:
        """Registra un ingreso o egreso manual de caja"""
        # Validar que la caja existe y está abierta
        caja = db.query(Caja).filter(Caja.id == caja_id).first()
        if not caja:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Caja no encontrada"
            )
        
        if caja.estado != 'abierta':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La caja está cerrada. No se pueden registrar movimientos."
            )
        
        # Crear movimiento
        movimiento = MovimientoCaja(
            caja_id=caja_id,
            tipo=data.tipo,
            monto=data.monto,
            concepto=data.concepto,
            usuario_id=usuario_id
        )
        
        db.add(movimiento)
        db.commit()
        db.refresh(movimiento)
        
        return movimiento
    
    @staticmethod
    def get_by_caja(
        db: Session,
        caja_id: int,
        tipo: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[MovimientoCaja]:
        """Obtiene movimientos de una caja"""
        query = db.query(MovimientoCaja).filter(MovimientoCaja.caja_id == caja_id)
        
        if tipo and tipo != 'todos':
            query = query.filter(MovimientoCaja.tipo == tipo)
        
        return query.order_by(MovimientoCaja.fecha.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_resumen(db: Session, caja_id: int) -> dict:
        """Obtiene resumen de movimientos de una caja"""
        # Total ingresos
        total_ingresos = db.query(func.sum(MovimientoCaja.monto))\
            .filter(and_(
                MovimientoCaja.caja_id == caja_id,
                MovimientoCaja.tipo == 'ingreso'
            )).scalar() or Decimal(0)
        
        # Total egresos
        total_egresos = db.query(func.sum(MovimientoCaja.monto))\
            .filter(and_(
                MovimientoCaja.caja_id == caja_id,
                MovimientoCaja.tipo == 'egreso'
            )).scalar() or Decimal(0)
        
        # Contar movimientos
        count_ingresos = db.query(MovimientoCaja)\
            .filter(and_(
                MovimientoCaja.caja_id == caja_id,
                MovimientoCaja.tipo == 'ingreso'
            )).count()
        
        count_egresos = db.query(MovimientoCaja)\
            .filter(and_(
                MovimientoCaja.caja_id == caja_id,
                MovimientoCaja.tipo == 'egreso'
            )).count()
        
        return {
            'caja_id': caja_id,
            'total_ingresos': float(total_ingresos),
            'total_egresos': float(total_egresos),
            'saldo': float(total_ingresos - total_egresos),
            'count_ingresos': count_ingresos,
            'count_egresos': count_egresos
        }
    
    @staticmethod
    def get_movimientos_con_usuario(db: Session, caja_id: int) -> List[dict]:
        """Obtiene movimientos con nombre de usuario"""
        movimientos = MovimientoCajaService.get_by_caja(db, caja_id)
        
        result = []
        for mov in movimientos:
            usuario = db.query(Usuario).filter(Usuario.id == mov.usuario_id).first()
            usuario_nombre = usuario.nombre if usuario else "Desconocido"
            
            result.append({
                'id': mov.id,
                'caja_id': mov.caja_id,
                'tipo': mov.tipo,
                'monto': mov.monto,
                'concepto': mov.concepto,
                'factura_id': mov.factura_id,
                'usuario_id': mov.usuario_id,
                'usuario_nombre': usuario_nombre,
                'fecha': mov.fecha
            })
        
        return result
