from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile

from ..database import get_db
from ..schemas.especialista import (
    EspecialistaCreate, EspecialistaUpdate, EspecialistaResponse,
    HorarioEspecialistaCreate, HorarioEspecialistaUpdate, HorarioEspecialistaResponse, HorariosBatchCreate,
    BloqueoEspecialistaCreate, BloqueoEspecialistaUpdate, BloqueoEspecialistaResponse,
    EspecialistaServicioCreate, EspecialistaServicioUpdate, EspecialistaServicioResponse,
    DisponibilidadRequest, DisponibilidadGeneralRequest, DisponibilidadResponse,
    DisponibilidadNombreRequest, DisponibilidadNombreResponse
)
from ..services.especialista_service import EspecialistaService
from ..services.horario_service import HorarioService
from ..services.bloqueo_service import BloqueoService
from ..services.comision_especialista_service import ComisionEspecialistaService
from ..services.disponibilidad_service import DisponibilidadService
from ..services.permission_service import PermissionService
from ..dependencies import require_permission, get_current_user
from ..models import Usuario

router = APIRouter(
    prefix="/api/especialistas",
    tags=["Especialistas"]
)


# ============================================
# ENDPOINTS CRUD DE ESPECIALISTAS
# ============================================

@router.get("", response_model=List[EspecialistaResponse])
def listar_especialistas(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("especialistas.ver"))
):
    """
    BE-ESP-001: Listar especialistas
    Permiso: especialistas.ver
    """
    return EspecialistaService.get_all(db, user["user"].sede_id, skip, limit, estado)


@router.get("/activos", response_model=List[EspecialistaResponse])
def listar_especialistas_activos(
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission("agenda.ver"))
):
    """
    BE-ESP-006: Listar especialistas activos
    Permiso: agenda.ver
    """
    return EspecialistaService.get_activos(db, user["user"].sede_id)


@router.get("/{id}", response_model=EspecialistaResponse)
def obtener_especialista(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.ver"))
):
    """
    BE-ESP-002: Obtener especialista por ID
    Permiso: especialistas.ver
    """
    especialista = EspecialistaService.get_by_id(db, id)
    if not especialista:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Especialista no encontrado"
        )
    return especialista


@router.post("", response_model=EspecialistaResponse, status_code=status.HTTP_201_CREATED)
def crear_especialista(
    especialista: EspecialistaCreate,
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("especialistas.crear"))
):
    """
    BE-ESP-003: Crear especialista
    Permiso: especialistas.crear
    """
    current_user = auth_context['user']
    return EspecialistaService.create(db, especialista, admin_sede_id=current_user.sede_id)


@router.put("/{id}", response_model=EspecialistaResponse)
def actualizar_especialista(
    id: int,
    especialista: EspecialistaUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.editar"))
):
    """
    BE-ESP-004: Actualizar especialista
    Permiso: especialistas.editar
    """
    return EspecialistaService.update(db, id, especialista)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_especialista(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.eliminar"))
):
    """
    BE-ESP-005: Desactivar especialista (soft delete)
    Permiso: especialistas.eliminar
    """
    EspecialistaService.delete(db, id)
    return None


@router.post("/{id}/documentacion", status_code=status.HTTP_201_CREATED)
def subir_documentacion(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.editar"))
):
    """
    Subir documentación para un especialista
    Permiso: especialistas.editar
    """
    path = EspecialistaService.upload_documentation(db, id, file)
    return {"filename": file.filename, "path": path}


@router.get("/{id}/documentacion", response_model=List[dict])
def listar_documentacion(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.ver"))
):
    """
    Listar documentación de un especialista
    Permiso: especialistas.ver
    """
    return EspecialistaService.list_documentation(db, id)


@router.delete("/{id}/documentacion/{filename}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_documentacion(
    id: int,
    filename: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.editar"))
):
    """
    Eliminar archivo de documentación
    Permiso: especialistas.editar
    """
    EspecialistaService.delete_documentation(db, id, filename)
    return None


# ============================================
# ENDPOINTS DE HORARIOS
# ============================================

@router.get("/{id}/horarios", response_model=List[HorarioEspecialistaResponse])
def obtener_horarios(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.ver"))
):
    """
    BE-HOR-001: Obtener horarios de un especialista
    Permiso: especialistas.ver
    """
    return HorarioService.get_by_especialista(db, id)


@router.put("/{id}/horarios", response_model=List[HorarioEspecialistaResponse])
def guardar_horarios_batch(
    id: int,
    horarios: HorariosBatchCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    BE-HOR-002: Guardar horarios (batch) - Reemplaza todos los horarios existentes
    Permiso: especialistas.editar O ser el mismo especialista
    """
    is_admin = PermissionService.user_has_permission(db, current_user.id, "especialistas.editar")
    is_self = current_user.especialista_id == id
    
    if not is_admin and not is_self:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene permiso")

    return HorarioService.create_batch(db, id, horarios.horarios)


@router.post("/{id}/horarios", response_model=HorarioEspecialistaResponse, status_code=status.HTTP_201_CREATED)
def agregar_horario(
    id: int,
    horario: HorarioEspecialistaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    BE-HOR-003: Agregar horario individual
    Permiso: especialistas.editar O ser el mismo especialista
    """
    is_admin = PermissionService.user_has_permission(db, current_user.id, "especialistas.editar")
    is_self = current_user.especialista_id == id
    
    if not is_admin and not is_self:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene permiso")

    return HorarioService.create(db, id, horario)


@router.delete("/{id}/horarios/{horario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_horario(
    id: int,
    horario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    BE-HOR-004: Eliminar horario
    Permiso: especialistas.editar O ser el mismo especialista
    """
    is_admin = PermissionService.user_has_permission(db, current_user.id, "especialistas.editar")
    is_self = current_user.especialista_id == id
    
    if not is_admin and not is_self:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene permiso")

    HorarioService.delete(db, horario_id)
    return None


# ============================================
# ENDPOINTS DE BLOQUEOS
# ============================================

@router.get("/{id}/bloqueos", response_model=List[BloqueoEspecialistaResponse])
def listar_bloqueos(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.ver"))
):
    """
    BE-BLQ-001: Listar bloqueos de un especialista
    Permiso: especialistas.ver
    """
    return BloqueoService.get_by_especialista(db, id)


@router.post("/{id}/bloqueos", response_model=BloqueoEspecialistaResponse, status_code=status.HTTP_201_CREATED)
def crear_bloqueo(
    id: int,
    bloqueo: BloqueoEspecialistaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    BE-BLQ-002: Crear bloqueo
    Permiso: especialistas.editar O ser el mismo especialista
    """
    is_admin = PermissionService.user_has_permission(db, current_user.id, "especialistas.editar")
    is_self = current_user.especialista_id == id
    
    if not is_admin and not is_self:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene permiso")

    return BloqueoService.create(db, id, bloqueo)


@router.put("/{id}/bloqueos/{bloqueo_id}", response_model=BloqueoEspecialistaResponse)
def actualizar_bloqueo(
    id: int,
    bloqueo_id: int,
    bloqueo: BloqueoEspecialistaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    BE-BLQ-003: Actualizar bloqueo
    Permiso: especialistas.editar O ser el mismo especialista
    """
    is_admin = PermissionService.user_has_permission(db, current_user.id, "especialistas.editar")
    is_self = current_user.especialista_id == id
    
    if not is_admin and not is_self:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene permiso")

    return BloqueoService.update(db, bloqueo_id, bloqueo)


@router.delete("/{id}/bloqueos/{bloqueo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_bloqueo(
    id: int,
    bloqueo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    BE-BLQ-004: Eliminar bloqueo
    Permiso: especialistas.editar O ser el mismo especialista
    """
    is_admin = PermissionService.user_has_permission(db, current_user.id, "especialistas.editar")
    is_self = current_user.especialista_id == id
    
    if not is_admin and not is_self:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene permiso")

    BloqueoService.delete(db, bloqueo_id)
    return None


# ============================================
# ENDPOINTS DE SERVICIOS DEL ESPECIALISTA
# ============================================

@router.get("/{id}/servicios", response_model=List[EspecialistaServicioResponse])
def listar_servicios_especialista(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.ver"))
):
    """
    BE-ESPSVC-001: Listar servicios asignados a un especialista
    Permiso: especialistas.ver
    """
    return ComisionEspecialistaService.get_by_especialista(db, id)


@router.post("/{id}/servicios", response_model=EspecialistaServicioResponse, status_code=status.HTTP_201_CREATED)
def asignar_servicio(
    id: int,
    servicio: EspecialistaServicioCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.editar"))
):
    """
    BE-ESPSVC-002: Asignar servicio a especialista
    Permiso: especialistas.editar
    """
    return ComisionEspecialistaService.create(db, id, servicio)


@router.put("/{id}/servicios/{servicio_id}", response_model=EspecialistaServicioResponse)
def actualizar_comision(
    id: int,
    servicio_id: int,
    servicio: EspecialistaServicioUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.editar"))
):
    """
    BE-ESPSVC-003: Actualizar comisión de un servicio
    Permiso: especialistas.editar
    """
    return ComisionEspecialistaService.update(db, id, servicio_id, servicio)


@router.delete("/{id}/servicios/{servicio_id}", status_code=status.HTTP_204_NO_CONTENT)
def quitar_servicio(
    id: int,
    servicio_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("especialistas.editar"))
):
    """
    BE-ESPSVC-004: Quitar servicio de un especialista
    Permiso: especialistas.editar
    """
    ComisionEspecialistaService.delete(db, id, servicio_id)
    return None


# ============================================
# ENDPOINTS DE DISPONIBILIDAD
# ============================================

@router.get("/{id}/disponibilidad", response_model=DisponibilidadResponse)
def obtener_disponibilidad(
    id: int,
    servicio_id: int,
    fecha_inicio: str,
    fecha_fin: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.ver"))
):
    """
    BE-DISP-001: Obtener slots disponibles de un especialista
    Permiso: agenda.ver
    """
    from datetime import datetime
    fecha_inicio_date = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
    fecha_fin_date = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
    
    return DisponibilidadService.get_disponibilidad_especialista(
        db, id, servicio_id, fecha_inicio_date, fecha_fin_date
    )


@router.get("/disponibilidad", response_model=List[DisponibilidadResponse])
def obtener_disponibilidad_general(
    servicio_id: int,
    fecha_inicio: str,
    fecha_fin: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.ver"))
):
    """
    BE-DISP-002: Obtener disponibilidad general de todos los especialistas para un servicio
    Permiso: agenda.ver
    """
    from datetime import datetime
    fecha_inicio_date = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
    fecha_fin_date = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
    
    return DisponibilidadService.get_disponibilidad_general(
        db, servicio_id, fecha_inicio_date, fecha_fin_date
    )

@router.post("/consultar-disponibilidad-nombre", response_model=DisponibilidadNombreResponse)
def consultar_disponibilidad_nombre(
    request: DisponibilidadNombreRequest,
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("agenda.ver"))
):
    """
    BE-DISP-003: Consultar disponibilidad de un especialista por nombre (para agente IA)
    Permiso: agenda.ver
    """
    return DisponibilidadService.consultar_disponibilidad_por_nombre(
        db=db,
        sede_id=auth_context["user"].sede_id,
        nombre_especialista=request.nombre_especialista,
        servicio=request.servicio,
        fecha=request.fecha,
        hora_inicio=request.hora_inicio
    )
