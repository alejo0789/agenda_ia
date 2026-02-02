"""
Servicio de negocio para gestión de Cajas

Incluye:
- Apertura y cierre de cajas
- Cálculo de cuadre
- Control de concurrencia (una sola caja abierta)
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from fastapi import HTTPException, status

from ..models.caja import Caja, MovimientoCaja, PagoFactura, Factura, MetodoPago
from ..models.user import Usuario
from ..schemas.caja import CajaAperturaCreate, CajaCierreCreate


class CajaService:
    """Servicio para gestión de cajas"""
    
    @staticmethod
    def obtener_caja_actual(db: Session, sede_id: int) -> Optional[Caja]:
        """Obtiene la caja actualmente abierta para una sede"""
        return db.query(Caja).filter(and_(Caja.estado == 'abierta', Caja.sede_id == sede_id)).first()
    
    @staticmethod
    def validar_unica_caja_abierta(db: Session, sede_id: int):
        """Valida que no haya más de una caja abierta en la sede"""
        count = db.query(Caja).filter(and_(Caja.estado == 'abierta', Caja.sede_id == sede_id)).count()
        if count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una caja abierta en esta sede. Debe cerrarla antes de abrir una nueva."
            )
    
    @staticmethod
    def abrir_caja(db: Session, data: CajaAperturaCreate, usuario_id: int, sede_id: int) -> Caja:
        """Abre una nueva caja"""
        # Validar que no exista caja abierta en la sede
        CajaService.validar_unica_caja_abierta(db, sede_id)
        
        # Crear nueva caja
        nueva_caja = Caja(
            nombre=data.nombre,
            usuario_apertura=usuario_id,
            sede_id=sede_id,
            fecha_apertura=datetime.now(),
            monto_apertura=data.monto_apertura,
            estado='abierta',
            notas=data.notas
        )
        
        db.add(nueva_caja)
        db.flush()
        
        # Registrar movimiento de apertura (solo si hay monto)
        if data.monto_apertura > 0:
            movimiento = MovimientoCaja(
                caja_id=nueva_caja.id,
                tipo='ingreso',
                monto=data.monto_apertura,
                concepto='Apertura de caja',
                usuario_id=usuario_id
            )
            db.add(movimiento)
        
        db.commit()
        db.refresh(nueva_caja)
        
        return nueva_caja
    
    @staticmethod
    def cerrar_caja(db: Session, caja_id: int, data: CajaCierreCreate, usuario_id: int) -> Caja:
        """Cierra una caja y calcula diferencia"""
        caja = db.query(Caja).filter(Caja.id == caja_id).first()
        
        if not caja:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Caja no encontrada"
            )
        
        if caja.estado == 'cerrada':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La caja ya está cerrada"
            )
        
        # Actualizar caja
        caja.usuario_cierre = usuario_id
        caja.fecha_cierre = datetime.now()
        caja.monto_cierre = data.monto_cierre
        caja.estado = 'cerrada'
        if data.notas:
            caja.notas = (caja.notas or '') + '\n' + data.notas
        
        db.commit()
        db.refresh(caja)
        
        return caja
    
    @staticmethod
    def get_by_id(db: Session, caja_id: int) -> Optional[Caja]:
        """Obtiene una caja por ID"""
        return db.query(Caja).filter(Caja.id == caja_id).first()
    
    @staticmethod
    def get_all(
        db: Session,
        sede_id: int,
        estado: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Caja]:
        """Obtiene todas las cajas de una sede con filtros opcionales"""
        query = db.query(Caja).filter(Caja.sede_id == sede_id)
        
        if estado and estado != 'todos':
            query = query.filter(Caja.estado == estado)
        
        return query.order_by(Caja.fecha_apertura.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_all_paginado(
        db: Session,
        sede_id: int,
        estado: Optional[str] = None,
        pagina: int = 1,
        por_pagina: int = 20
    ) -> dict:
        """Obtiene cajas con paginación para una sede"""
        query = db.query(Caja).filter(Caja.sede_id == sede_id)
        
        if estado and estado != 'todos':
            query = query.filter(Caja.estado == estado)
        
        total = query.count()
        offset = (pagina - 1) * por_pagina
        cajas = query.order_by(Caja.fecha_apertura.desc()).offset(offset).limit(por_pagina).all()
        
        total_paginas = (total + por_pagina - 1) // por_pagina
        
        return {
            'total': total,
            'pagina': pagina,
            'por_pagina': por_pagina,
            'total_paginas': total_paginas,
            'items': cajas
        }
    
    @staticmethod
    def calcular_cuadre(db: Session, caja_id: int) -> dict:
        """Calcula el cuadre de caja detallado"""
        caja = db.query(Caja).filter(Caja.id == caja_id).first()
        
        if not caja:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Caja no encontrada"
            )
        
        # Obtener movimientos
        ingresos = db.query(func.sum(MovimientoCaja.monto))\
            .filter(and_(
                MovimientoCaja.caja_id == caja_id,
                MovimientoCaja.tipo == 'ingreso'
            )).scalar() or Decimal(0)
        
        egresos = db.query(func.sum(MovimientoCaja.monto))\
            .filter(and_(
                MovimientoCaja.caja_id == caja_id,
                MovimientoCaja.tipo == 'egreso'
            )).scalar() or Decimal(0)
        
        # Obtener ventas por método de pago
        ventas_por_metodo = db.query(
            MetodoPago.nombre,
            func.sum(PagoFactura.monto).label('total')
        ).select_from(PagoFactura)\
         .join(Factura, PagoFactura.factura_id == Factura.id)\
         .join(MetodoPago, PagoFactura.metodo_pago_id == MetodoPago.id)\
         .filter(and_(
             Factura.caja_id == caja_id,
             Factura.estado == 'pagada'
         ))\
         .group_by(MetodoPago.nombre)\
         .all()
        
        monto_apertura = Decimal(str(caja.monto_apertura or 0))
        efectivo_teorico = monto_apertura + Decimal(str(ingresos)) - Decimal(str(egresos))
        monto_cierre = Decimal(str(caja.monto_cierre or 0))
        diferencia = monto_cierre - efectivo_teorico if caja.monto_cierre else Decimal(0)
        
        # Obtener nombres de usuarios
        usuario_apertura_nombre = None
        usuario_cierre_nombre = None
        if caja.usuario_apertura:
            usuario = db.query(Usuario).filter(Usuario.id == caja.usuario_apertura).first()
            if usuario:
                usuario_apertura_nombre = usuario.nombre
        if caja.usuario_cierre:
            usuario = db.query(Usuario).filter(Usuario.id == caja.usuario_cierre).first()
            if usuario:
                usuario_cierre_nombre = usuario.nombre
        
        return {
            'caja_id': caja.id,
            'nombre': caja.nombre,
            'fecha_apertura': caja.fecha_apertura,
            'fecha_cierre': caja.fecha_cierre,
            'monto_apertura': float(monto_apertura),
            'ingresos_adicionales': float(Decimal(str(ingresos)) - monto_apertura),
            'egresos': float(egresos),
            'efectivo_teorico': float(efectivo_teorico),
            'efectivo_real': float(monto_cierre),
            'diferencia': float(diferencia),
            'ventas_por_metodo': [
                {'metodo': nombre, 'total': float(total or 0)}
                for nombre, total in ventas_por_metodo
            ],
            'usuario_apertura_nombre': usuario_apertura_nombre,
            'usuario_cierre_nombre': usuario_cierre_nombre
        }
    
    @staticmethod
    def get_detalle(db: Session, caja_id: int) -> dict:
        """Obtiene detalle completo de una caja"""
        caja = CajaService.get_by_id(db, caja_id)
        if not caja:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Caja no encontrada"
            )
        
        cuadre = CajaService.calcular_cuadre(db, caja_id)
        
        return {
            'id': caja.id,
            'nombre': caja.nombre,
            'estado': caja.estado,
            'fecha_apertura': caja.fecha_apertura,
            'monto_apertura': caja.monto_apertura,
            'fecha_cierre': caja.fecha_cierre,
            'monto_cierre': caja.monto_cierre,
            'notas': caja.notas,
            'total_efectivo_teorico': cuadre['efectivo_teorico'],
            'diferencia': cuadre['diferencia'],
            'usuario_apertura_nombre': cuadre.get('usuario_apertura_nombre'),
            'usuario_cierre_nombre': cuadre.get('usuario_cierre_nombre')
        }
