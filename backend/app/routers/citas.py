from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ..database import get_db
from ..schemas.cita import (
    CitaCreate, CitaUpdate, CitaResponse, CitaListResponse, CitaCambiarEstado,
    CitaAgenteRequest
)
from ..schemas.cliente import ClienteCreate
from ..models.cliente import Cliente
from ..models.sede import Sede
from ..models.servicio import Servicio
from ..models.especialista import Especialista, EspecialistaServicio
from ..services.cita_service import CitaService
from ..services.cliente_service import ClienteService
from ..dependencies import require_permission

router = APIRouter(
    prefix="/api/citas",
    tags=["Citas"]
)


# ============================================
# ENDPOINTS CRUD
# ============================================

@router.get("", response_model=List[CitaListResponse])
def listar_citas(
    fecha_inicio: date = Query(..., description="Fecha inicio"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (opcional)"),
    especialista_id: Optional[int] = Query(None, description="Filtrar por especialista"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("agenda.ver"))
):
    """
    Listar citas por rango de fechas
    Permiso: agenda.ver
    """
    citas = CitaService.get_by_fecha(
        db=db,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        especialista_id=especialista_id,
        estado=estado,
        sede_id=auth_context["user"].sede_id
    )
    return [CitaService.format_cita_list(c) for c in citas]


@router.get("/{cita_id}", response_model=CitaResponse)
def obtener_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.ver"))
):
    """
    Obtener una cita por ID
    Permiso: agenda.ver
    """
    cita = CitaService.get_by_id(db, cita_id)
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    
    # Cargar relaciones
    return {
        "id": cita.id,
        "cliente_id": cita.cliente_id,
        "especialista_id": cita.especialista_id,
        "servicio_id": cita.servicio_id,
        "fecha": cita.fecha,
        "hora_inicio": cita.hora_inicio,
        "hora_fin": cita.hora_fin,
        "duracion_minutos": cita.duracion_minutos,
        "estado": cita.estado,
        "notas": cita.notas,
        "notas_internas": cita.notas_internas,
        "precio": cita.precio,
        "fecha_creacion": cita.fecha_creacion,
        "fecha_actualizacion": cita.fecha_actualizacion,
        "cliente": {
            "id": cita.cliente.id,
            "nombre": cita.cliente.nombre,
            "apellido": cita.cliente.apellido,
            "telefono": cita.cliente.telefono
        } if cita.cliente else None,
        "especialista": {
            "id": cita.especialista.id,
            "nombre": cita.especialista.nombre,
            "apellido": cita.especialista.apellido,
            "color": None  # El modelo no tiene color, se asigna desde frontend
        } if cita.especialista else None,
        "servicio": {
            "id": cita.servicio.id,
            "nombre": cita.servicio.nombre,
            "duracion_minutos": cita.servicio.duracion_minutos,
            "precio_base": cita.servicio.precio_base,
            "color_calendario": cita.servicio.color_calendario
        } if cita.servicio else None
    }


@router.post("", response_model=CitaResponse, status_code=status.HTTP_201_CREATED)
def crear_cita(
    cita_data: CitaCreate,
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("agenda.crear"))
):
    """
    Crear una nueva cita
    Permiso: agenda.crear
    """
    try:
        current_user = auth_context["user"]
        cita = CitaService.crear(db, cita_data, current_user.id, current_user.sede_id)
        return obtener_cita(cita.id, db, auth_context)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{cita_id}", response_model=CitaResponse)
def actualizar_cita(
    cita_id: int,
    cita_data: CitaUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.editar"))
):
    """
    Actualizar una cita existente
    Permiso: agenda.editar
    """
    cita = CitaService.actualizar(db, cita_id, cita_data)
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    return obtener_cita(cita_id, db, _)


@router.patch("/{cita_id}/estado", response_model=CitaResponse)
def cambiar_estado_cita(
    cita_id: int,
    estado_data: CitaCambiarEstado,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.editar"))
):
    """
    Cambiar el estado de una cita
    Permiso: agenda.editar
    """
    cita = CitaService.cambiar_estado(db, cita_id, estado_data.estado, estado_data.notas_internas)
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    return obtener_cita(cita_id, db, _)


@router.delete("/{cita_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.eliminar"))
):
    """
    Eliminar una cita (solo si no está completada)
    Permiso: agenda.eliminar
    """
    try:
        if not CitaService.eliminar(db, cita_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cita no encontrada"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )



# ============================================
# ENDPOINTS ADICIONALES
# ============================================

@router.post("/agendar-externo", response_model=CitaResponse, status_code=status.HTTP_201_CREATED)
def agendar_cita_externo(
    request: CitaAgenteRequest,
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("agenda.crear"))
):
    """
    Crear cita desde agente externo (n8n/whatsapp)
    - Busca o crea cliente por cédula
    - Busca servicio y sede por nombre
    - Asigna especialista por defecto si es necesario
    - Registra abono si aplica
    """
    # 1. Validar Sede (Prioridad: Sede enviada por el agente)
    nombre_sede = request.sede
    sede = db.query(Sede).filter(Sede.nombre.ilike(f"%{nombre_sede}%"), Sede.estado == 'activa').first()
    if not sede:
        # Si no la encuentra por nombre, intentamos buscar una marcada como principal
        sede = db.query(Sede).filter(Sede.es_principal == True).first()
        if not sede:
            raise HTTPException(status_code=400, detail=f"Sede '{nombre_sede}' no encontrada")

    # 2. Validar o buscar Servicio (alisado, repolarizacion, garantia)
    nombre_servicio = request.servicio
    servicio = db.query(Servicio).filter(Servicio.nombre.ilike(f"%{nombre_servicio}%"), Servicio.sede_id == sede.id).first()
    
    if not servicio:
        raise HTTPException(status_code=400, detail=f"Servicio '{nombre_servicio}' no encontrado en la sede {sede.nombre}")

    # 3. Buscar o Crear Cliente
    if not request.nombre or not request.cedula or not request.telefono:
        raise HTTPException(status_code=400, detail="Nombre, Cédula y Teléfono del cliente son obligatorios")

    cliente_existente = db.query(Cliente).filter(
        or_(
            Cliente.cedula == request.cedula,
            Cliente.telefono == request.telefono
        )
    ).first()
    
    if not cliente_existente:
        nuevo_cliente_data = ClienteCreate(
            nombre=request.nombre,
            apellido=request.apellido,
            cedula=request.cedula,
            telefono=request.telefono,
            email=request.email
        )
        cliente_existente = ClienteService.create(db, nuevo_cliente_data, sede.id)
    
    # 4. Asignar Especialista
    especialista_id = request.especialista_id
    if not especialista_id:
        # Buscar el primer especialista activo en esa sede
        especialista = db.query(Especialista).filter(Especialista.sede_id == sede.id, Especialista.estado == 'activo').first()
        if not especialista:
            raise HTTPException(status_code=400, detail="No hay especialistas disponibles en esta sede")
        especialista_id = especialista.id

    # 5. Crear Cita
    try:
        cita_create = CitaCreate(
            cliente_id=cliente_existente.id,
            especialista_id=especialista_id,
            servicio_id=servicio.id,
            fecha=request.fecha,
            hora_inicio=request.hora_inicio,
            notas=request.notas,
            # Abono
            monto_abono=request.monto_abono,
            metodo_pago_id=request.metodo_pago_id,
            referencia_pago=request.referencia_abono,
            concepto_abono=request.concepto_abono
        )
    
        current_user = auth_context["user"]
        # Usamos la sede detectada por el bot en lugar de la del usuario que ejecuta si es diferente
        cita = CitaService.crear(db, cita_create, current_user.id, sede.id)
        
        # Devolver respuesta completa
        return obtener_cita(cita.id, db, auth_context)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )



@router.get("/cliente/{cliente_id}", response_model=List[CitaListResponse])
def listar_citas_cliente(
    cliente_id: int,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.ver"))
):
    """
    Listar citas de un cliente
    Permiso: agenda.ver
    """
    citas = CitaService.get_by_cliente(db, cliente_id, limit)
    return [CitaService.format_cita_list(c) for c in citas]


@router.get("/especialista/{especialista_id}/fecha/{fecha}", response_model=List[CitaListResponse])
def listar_citas_especialista(
    especialista_id: int,
    fecha: date,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.ver"))
):
    """
    Listar citas de un especialista en una fecha
    Permiso: agenda.ver
    """
    citas = CitaService.get_by_especialista(db, especialista_id, fecha)
    return [CitaService.format_cita_list(c) for c in citas]
