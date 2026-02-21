from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..schemas.ficha_tecnica import (
    PlantillaFichaCreate, PlantillaFichaUpdate, PlantillaFichaResponse,
    CampoFichaCreate, CampoFichaResponse,
    CitaFichaCreate, CitaFichaResponse,
    FormularioPublicoSubmit
)
from ..services.ficha_tecnica_service import FichaTecnicaService
from ..dependencies import require_permission

router = APIRouter(
    prefix="/api/fichas",
    tags=["Fichas Técnicas"]
)

# ================================
# PLANTILLAS
# ================================

@router.post("/plantillas", response_model=PlantillaFichaResponse, status_code=status.HTTP_201_CREATED)
def crear_plantilla(
    plantilla: PlantillaFichaCreate,
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("agenda.crear"))
):
    """
    Crea una nueva plantilla de ficha técnica con sus campos.
    Permiso requerido: agenda.crear
    """
    # Si la sede viene vacía (None), la hace global. Sino, de su sede actual.
    if plantilla.sede_id is None:
        plantilla.sede_id = auth_context["user"].sede_id
        
    try:
        nueva_plantilla = FichaTecnicaService.crear_plantilla(db, plantilla)
        return nueva_plantilla
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/plantillas", response_model=List[PlantillaFichaResponse])
def listar_plantillas(
    activa: Optional[bool] = Query(None, description="Filtrar activas/inactivas"),
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("agenda.ver"))
):
    """
    Listar plantillas de fichas técnicas disponibles para la sede del usuario.
    Permiso requerido: agenda.ver (para poder seleccionarla) o agenda.crear
    """
    sede_id = auth_context["user"].sede_id
    plantillas = FichaTecnicaService.obtener_plantillas(db, activa=activa, sede_id=sede_id)
    return plantillas

@router.get("/plantillas/{id}", response_model=PlantillaFichaResponse)
def obtener_plantilla(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.ver"))
):
    """
    Obtener detalle de plantilla por ID.
    """
    plantilla = FichaTecnicaService.obtener_plantilla_por_id(db, id)
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return plantilla

@router.put("/plantillas/{id}", response_model=PlantillaFichaResponse)
def actualizar_plantilla(
    id: int,
    plantilla: PlantillaFichaUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.crear"))
):
    """
    Actualizar datos básicos de la plantilla.
    """
    actualizada = FichaTecnicaService.actualizar_plantilla(db, id, plantilla)
    if not actualizada:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return actualizada

# ================================
# VINCULACION CON CITAS
# ================================

@router.post("/cita-ficha", response_model=CitaFichaResponse, status_code=status.HTTP_201_CREATED)
def vincular_ficha_a_cita(
    vinculacion: CitaFichaCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.editar"))
):
    """
    Asigna una ficha técnica vacía a una cita (estado 'pendiente').
    Permiso requerido: agenda.editar
    """
    try:
        vinculo = FichaTecnicaService.vincular_ficha_a_cita(db, vinculacion)
        return CitaFichaResponse.model_validate(vinculo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/cita-ficha/{cita_id}", response_model=List[CitaFichaResponse])
def listar_fichas_de_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.ver"))
):
    """
    Devuelve todas las fichas (pendientes, enviadas, diligenciadas) vinculadas a una cita.
    """
    fichas = FichaTecnicaService.obtener_fichas_por_cita(db, cita_id)
    return [CitaFichaResponse.model_validate(f) for f in fichas]

@router.post("/cita-ficha/{cita_ficha_id}/marcar-enviada", response_model=CitaFichaResponse)
def marcar_ficha_enviada(
    cita_ficha_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.editar"))
):
    """
    Cambia el estado del vínculo a "enviada". Esto se llama tras apretar el botón de Enviar Whatsapp.
    """
    ficha = FichaTecnicaService.marcar_como_enviada(db, cita_ficha_id)
    if not ficha:
         raise HTTPException(status_code=404, detail="Vínculo Ficha-Cita no encontrado")
    return CitaFichaResponse.model_validate(ficha)


# ================================
# FORMULARIO PÚBLICO
# ================================

@router.get("/publico/{token}")
def obtener_formulario_publico(token: str, db: Session = Depends(get_db)):
    """
    Endpoint PÚBLICO (Sin token JWT).
    Retorna la estructura del formulario basada en el token único enviado al cliente.
    """
    formulario = FichaTecnicaService.obtener_formulario_publico(db, token)
    if not formulario:
        raise HTTPException(status_code=404, detail="Formulario no encontrado o link expirado")
    return formulario

@router.post("/publico/{token}/submit")
def guardar_formulario_publico(
    token: str,
    respuestas: FormularioPublicoSubmit,
    db: Session = Depends(get_db)
):
    """
    Endpoint PÚBLICO (Sin token JWT).
    El cliente guarda las respuestas del formulario de su ficha técnica.
    """
    try:
        exito = FichaTecnicaService.guardar_respuestas_formulario(db, token, respuestas)
        if exito:
            return {"status": "success", "message": "Respuestas guardadas correctamente"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al guardar las respuestas")
