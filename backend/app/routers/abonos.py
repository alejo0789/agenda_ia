"""
Router de Abonos

Endpoints para:
- Crear abonos
- Listar abonos
- Consultar saldo de cliente
- Obtener abonos para facturación
- Anular abonos
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from ..database import get_db
from ..services.abono_service import AbonoService, get_abono_service
from ..schemas.abono import (
    AbonoCreate, AbonoResponse, AbonoListItem, AbonoClienteResumen,
    AbonosClienteFactura, AbonoAnular
)
from ..models.abono import Abono
from ..models.caja import MetodoPago, Caja
from ..dependencies import require_permission

router = APIRouter(prefix="/api/abonos", tags=["Abonos"])


def _abono_to_response(abono: Abono) -> AbonoResponse:
    """Convierte modelo a schema de respuesta"""
    cliente_nombre = f"{abono.cliente.nombre} {abono.cliente.apellido or ''}".strip()
    metodo_nombre = abono.metodo_pago.nombre if abono.metodo_pago else "Desconocido"
    
    return AbonoResponse(
        id=abono.id,
        cliente_id=abono.cliente_id,
        cliente_nombre=cliente_nombre,
        monto=abono.monto,
        saldo_disponible=abono.saldo_disponible,
        cita_id=abono.cita_id,
        metodo_pago_id=abono.metodo_pago_id,
        metodo_pago_nombre=metodo_nombre,
        referencia_pago=abono.referencia_pago,
        estado=abono.estado,
        concepto=abono.concepto,
        fecha_creacion=abono.fecha_creacion
    )


@router.post("", response_model=AbonoResponse, status_code=status.HTTP_201_CREATED)
async def crear_abono(
    data: AbonoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("abonos.crear"))
):
    """
    Crea un nuevo abono para un cliente.
    
    - Requiere permiso: abonos.crear
    - Opcionalmente se puede vincular a una cita
    - Si hay caja abierta y es efectivo, registra movimiento de ingreso
    """
    service = get_abono_service(db)
    
    # Buscar caja abierta del usuario
    user = current_user["user"]
    caja_abierta = db.query(Caja).filter(
        Caja.usuario_apertura == user.id,
        Caja.estado == 'abierta'
    ).first()
    
    caja_id = caja_abierta.id if caja_abierta else None
    
    abono = service.crear_abono(
        data=data,
        usuario_id=user.id,
        caja_id=caja_id
    )
    
    return _abono_to_response(abono)


@router.get("", response_model=List[AbonoListItem])
async def listar_abonos(
    cliente_id: Optional[int] = Query(None, description="Filtrar por cliente"),
    estado: Optional[str] = Query(None, description="Filtrar por estado (disponible, usado, anulado)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("abonos.ver"))
):
    """
    Lista abonos con filtros opcionales.
    
    - Requiere permiso: abonos.ver
    """
    service = get_abono_service(db)
    abonos = service.listar_abonos(
        cliente_id=cliente_id,
        estado=estado,
        skip=skip,
        limit=limit
    )
    
    result = []
    for abono in abonos:
        cliente_nombre = f"{abono.cliente.nombre} {abono.cliente.apellido or ''}".strip()
        result.append(AbonoListItem(
            id=abono.id,
            cliente_id=abono.cliente_id,
            cliente_nombre=cliente_nombre,
            monto=abono.monto,
            saldo_disponible=abono.saldo_disponible,
            estado=abono.estado,
            cita_id=abono.cita_id,
            concepto=abono.concepto,
            fecha_creacion=abono.fecha_creacion
        ))
    
    return result


# ===== RUTAS DE CLIENTE ANTES DE /{abono_id} =====

@router.get("/cliente/{cliente_id}/resumen", response_model=AbonoClienteResumen)
async def obtener_resumen_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("abonos.ver"))
):
    """
    Obtiene el resumen de abonos de un cliente.
    Incluye total de abonos y saldo disponible.
    
    - Requiere permiso: abonos.ver
    """
    service = get_abono_service(db)
    return service.obtener_abonos_cliente(cliente_id)


@router.get("/cliente/{cliente_id}/para-factura", response_model=AbonosClienteFactura)
async def obtener_abonos_para_factura(
    cliente_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("abonos.ver"))
):
    """
    Obtiene los abonos disponibles de un cliente para aplicar en factura.
    Solo devuelve abonos con saldo > 0.
    
    - Requiere permiso: facturas.crear
    """
    service = get_abono_service(db)
    return service.obtener_abonos_para_factura(cliente_id)


# ===== RUTAS CON PARAMETRO DINAMICO AL FINAL =====

@router.get("/{abono_id}", response_model=AbonoResponse)
async def obtener_abono(
    abono_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("abonos.ver"))
):
    """
    Obtiene un abono por ID.
    
    - Requiere permiso: abonos.ver
    """
    service = get_abono_service(db)
    abono = service.obtener_abono(abono_id)
    
    if not abono:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Abono no encontrado"
        )
    
    return _abono_to_response(abono)


@router.post("/{abono_id}/anular", response_model=AbonoResponse)
async def anular_abono(
    abono_id: int,
    data: AbonoAnular,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_permission("abonos.anular"))
):
    """
    Anula un abono.
    Solo se puede anular si tiene el saldo completo disponible.
    
    - Requiere permiso: abonos.anular
    """
    service = get_abono_service(db)
    abono = service.anular_abono(
        abono_id=abono_id,
        motivo=data.motivo,
        usuario_id=current_user["user"].id
    )
    
    return _abono_to_response(abono)
