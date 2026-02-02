"""
Servicio de Abonos

Lógica de negocio para:
- Crear abonos
- Consultar abonos y saldo de cliente
- Redimir abonos en facturas
- Anular abonos
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status

from ..models.abono import Abono, RedencionAbono
from ..models.cliente import Cliente
from ..models.caja import MetodoPago, Factura, MovimientoCaja
from ..models.cita import Cita
from ..schemas.abono import (
    AbonoCreate, AbonoResponse, AbonoListItem, AbonoClienteResumen,
    AbonoParaFactura, AbonosClienteFactura
)


class AbonoService:
    """Servicio para gestión de abonos"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def crear_abono(
        self,
        data: AbonoCreate,
        usuario_id: int,
        caja_id: Optional[int] = None
    ) -> Abono:
        """
        Crea un nuevo abono para un cliente.
        Opcionalmente lo vincula a una cita.
        """
        # Verificar que el cliente existe
        cliente = self.db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado"
            )
        
        # Verificar método de pago
        metodo_pago = self.db.query(MetodoPago).filter(MetodoPago.id == data.metodo_pago_id).first()
        if not metodo_pago:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Método de pago no encontrado"
            )
        
        # Si hay cita_id, verificar que existe y pertenece al cliente
        if data.cita_id:
            cita = self.db.query(Cita).filter(Cita.id == data.cita_id).first()
            if not cita:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Cita no encontrada"
                )
            if cita.cliente_id != data.cliente_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La cita no pertenece al cliente especificado"
                )
        
        # Crear el abono
        abono = Abono(
            cliente_id=data.cliente_id,
            monto=data.monto,
            saldo_disponible=data.monto,  # Inicialmente todo el monto está disponible
            cita_id=data.cita_id,
            metodo_pago_id=data.metodo_pago_id,
            referencia_pago=data.referencia_pago,
            concepto=data.concepto,
            estado='disponible',
            usuario_id=usuario_id
        )
        
        self.db.add(abono)
        
        # Si hay caja abierta, registrar movimiento de ingreso
        if caja_id:
            # Solo si es efectivo o similar, registrar en caja
            if metodo_pago.nombre.lower() == 'efectivo':
                movimiento = MovimientoCaja(
                    caja_id=caja_id,
                    tipo='ingreso',
                    monto=data.monto,
                    concepto=f"Abono cliente: {cliente.nombre} {cliente.apellido or ''}",
                    usuario_id=usuario_id
                )
                self.db.add(movimiento)
        
        self.db.commit()
        self.db.refresh(abono)
        
        return abono
    
    def obtener_abono(self, abono_id: int) -> Optional[Abono]:
        """Obtiene un abono por ID"""
        return self.db.query(Abono).filter(Abono.id == abono_id).first()
    
    def listar_abonos(
        self,
        cliente_id: Optional[int] = None,
        estado: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Abono]:
        """Lista abonos con filtros opcionales"""
        query = self.db.query(Abono)
        
        if cliente_id:
            query = query.filter(Abono.cliente_id == cliente_id)
        
        if estado:
            query = query.filter(Abono.estado == estado)
        
        return query.order_by(Abono.fecha_creacion.desc()).offset(skip).limit(limit).all()
    
    def obtener_abonos_cliente(self, cliente_id: int) -> AbonoClienteResumen:
        """
        Obtiene el resumen de abonos de un cliente,
        incluyendo saldo disponible total.
        """
        cliente = self.db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado"
            )
        
        abonos = self.db.query(Abono).filter(
            and_(
                Abono.cliente_id == cliente_id,
                Abono.estado == 'disponible'
            )
        ).order_by(Abono.fecha_creacion.desc()).all()
        
        total_abonos = sum(Decimal(str(a.monto)) for a in abonos)
        saldo_disponible = sum(Decimal(str(a.saldo_disponible)) for a in abonos)
        
        cliente_nombre = f"{cliente.nombre} {cliente.apellido or ''}".strip()
        
        return AbonoClienteResumen(
            cliente_id=cliente_id,
            cliente_nombre=cliente_nombre,
            total_abonos=total_abonos,
            saldo_disponible=saldo_disponible,
            cantidad_abonos=len(abonos),
            abonos=[
                AbonoListItem(
                    id=a.id,
                    cliente_id=a.cliente_id,
                    cliente_nombre=cliente_nombre,
                    monto=a.monto,
                    saldo_disponible=a.saldo_disponible,
                    estado=a.estado,
                    cita_id=a.cita_id,
                    concepto=a.concepto,
                    fecha_creacion=a.fecha_creacion
                )
                for a in abonos
            ]
        )
    
    def obtener_abonos_para_factura(self, cliente_id: int) -> AbonosClienteFactura:
        """
        Obtiene los abonos disponibles de un cliente para aplicar en factura.
        Solo devuelve abonos con saldo > 0.
        """
        cliente = self.db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado"
            )
        
        abonos = self.db.query(Abono).filter(
            and_(
                Abono.cliente_id == cliente_id,
                Abono.estado == 'disponible',
                Abono.saldo_disponible > 0
            )
        ).order_by(Abono.fecha_creacion.asc()).all()  # FIFO: primero los más antiguos
        
        saldo_total = sum(Decimal(str(a.saldo_disponible)) for a in abonos)
        cliente_nombre = f"{cliente.nombre} {cliente.apellido or ''}".strip()
        
        return AbonosClienteFactura(
            cliente_id=cliente_id,
            cliente_nombre=cliente_nombre,
            saldo_total_disponible=saldo_total,
            abonos=[
                AbonoParaFactura(
                    id=a.id,
                    monto_original=a.monto,
                    saldo_disponible=a.saldo_disponible,
                    concepto=a.concepto,
                    fecha_creacion=a.fecha_creacion,
                    cita_id=a.cita_id
                )
                for a in abonos
            ]
        )
    
    def aplicar_abono_a_factura(
        self,
        abono_id: int,
        factura_id: int,
        monto: Decimal
    ) -> RedencionAbono:
        """
        Aplica un monto de un abono a una factura.
        Reduce el saldo disponible del abono.
        """
        abono = self.db.query(Abono).filter(Abono.id == abono_id).first()
        if not abono:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Abono no encontrado"
            )
        
        if abono.estado != 'disponible':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El abono no está disponible (estado: {abono.estado})"
            )
        
        saldo_actual = Decimal(str(abono.saldo_disponible))
        if monto > saldo_actual:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Monto a aplicar ({monto}) excede el saldo disponible ({saldo_actual})"
            )
        
        # Verificar que la factura existe
        factura = self.db.query(Factura).filter(Factura.id == factura_id).first()
        if not factura:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada"
            )
        
        # Verificar que la factura es del mismo cliente
        if factura.cliente_id != abono.cliente_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El abono no pertenece al cliente de la factura"
            )
        
        # Crear registro de redención
        redencion = RedencionAbono(
            abono_id=abono_id,
            factura_id=factura_id,
            monto_aplicado=monto
        )
        self.db.add(redencion)
        
        # Actualizar saldo del abono
        nuevo_saldo = saldo_actual - monto
        abono.saldo_disponible = nuevo_saldo
        
        # Si el saldo queda en 0, marcar como usado
        if nuevo_saldo == 0:
            abono.estado = 'usado'
        
        self.db.commit()
        self.db.refresh(redencion)
        
        return redencion
    
    def anular_abono(self, abono_id: int, motivo: str, usuario_id: int) -> Abono:
        """
        Anula un abono.
        Solo se puede anular si tiene el saldo completo disponible.
        """
        abono = self.db.query(Abono).filter(Abono.id == abono_id).first()
        if not abono:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Abono no encontrado"
            )
        
        if abono.estado != 'disponible':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solo se pueden anular abonos disponibles (estado actual: {abono.estado})"
            )
        
        monto_original = Decimal(str(abono.monto))
        saldo_actual = Decimal(str(abono.saldo_disponible))
        
        if saldo_actual < monto_original:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede anular un abono parcialmente usado. Saldo usado: " + 
                       str(monto_original - saldo_actual)
            )
        
        abono.estado = 'anulado'
        abono.concepto = f"{abono.concepto or ''}\n[ANULADO] {motivo}".strip()
        
        self.db.commit()
        self.db.refresh(abono)
        
        return abono


def get_abono_service(db: Session) -> AbonoService:
    """Factory para obtener instancia del servicio"""
    return AbonoService(db)
