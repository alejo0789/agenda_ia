from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from decimal import Decimal

from app.database import get_db
from app.dependencies import get_current_user
from app.models import EspecialistaLiztoMapping, ServicioLiztoMapping, LiztoConfig
from app.services.lizto_sync_service import LiztoSyncService
from app.services.lizto_client import LiztoClient
from app.config import settings

router = APIRouter(prefix="/api/lizto", tags=["Lizto Integration"])

# Modelos Pydantic
class EspecialistaMappingInput(BaseModel):
    especialista_id: int
    lizto_staff_id: int
    lizto_staff_name: str | None = None

class ServicioMappingInput(BaseModel):
    servicio_id: int
    lizto_service_id: int
    lizto_price_id: int
    lizto_price_value: Decimal
    lizto_service_name: str | None = None

class ConfigInput(BaseModel):
    key: str
    value: str

# 1. Publicar Cita
@router.post("/publicar/{cita_id}")
def publicar_cita(cita_id: int, db: Session = Depends(get_db)):
    """Publica manualmente una cita en Lizto."""
    sync_service = LiztoSyncService()
    try:
        result = sync_service.sync_cita(db, cita_id)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. Gestión de Mapeo (Especialistas)
@router.get("/mapping/especialistas")
def listar_mapping_especialistas(db: Session = Depends(get_db)):
    mappings = db.query(EspecialistaLiztoMapping).all()
    return mappings

@router.post("/mapping/especialistas")
def guardar_mapping_especialista(mapping_in: EspecialistaMappingInput, db: Session = Depends(get_db)):
    mapping = db.query(EspecialistaLiztoMapping).filter(
        EspecialistaLiztoMapping.especialista_id == mapping_in.especialista_id
    ).first()

    if mapping:
        mapping.lizto_staff_id = mapping_in.lizto_staff_id
        mapping.lizto_staff_name = mapping_in.lizto_staff_name
    else:
        mapping = EspecialistaLiztoMapping(
            especialista_id=mapping_in.especialista_id,
            lizto_staff_id=mapping_in.lizto_staff_id,
            lizto_staff_name=mapping_in.lizto_staff_name
        )
        db.add(mapping)

    db.commit()
    db.refresh(mapping)
    return mapping

# 3. Gestión de Mapeo (Servicios)
@router.get("/mapping/servicios")
def listar_mapping_servicios(db: Session = Depends(get_db)):
    mappings = db.query(ServicioLiztoMapping).all()
    return mappings

@router.post("/mapping/servicios")
def guardar_mapping_servicio(mapping_in: ServicioMappingInput, db: Session = Depends(get_db)):
    mapping = db.query(ServicioLiztoMapping).filter(
        ServicioLiztoMapping.servicio_id == mapping_in.servicio_id
    ).first()

    if mapping:
        mapping.lizto_service_id = mapping_in.lizto_service_id
        mapping.lizto_price_id = mapping_in.lizto_price_id
        mapping.lizto_price_value = mapping_in.lizto_price_value
        mapping.lizto_service_name = mapping_in.lizto_service_name
    else:
        mapping = ServicioLiztoMapping(
            servicio_id=mapping_in.servicio_id,
            lizto_service_id=mapping_in.lizto_service_id,
            lizto_price_id=mapping_in.lizto_price_id,
            lizto_price_value=mapping_in.lizto_price_value,
            lizto_service_name=mapping_in.lizto_service_name
        )
        db.add(mapping)

    db.commit()
    db.refresh(mapping)
    return mapping

# 4. Utilidades con la API de Lizto (para listados en el panel admin)
@router.get("/staff")
def listar_staff_lizto(db: Session = Depends(get_db)):
    """Contacta Lizto para traer la lista de especialistas."""
    if not settings.lizto_email or not settings.lizto_password:
         raise HTTPException(status_code=500, detail="Credenciales Lizto no configuradas")
         
    # Leer location_id para filtrar el staff internamente
    config_location = db.query(LiztoConfig).filter(LiztoConfig.key == "location_id").first()
    location_id = int(config_location.value) if config_location else 8

    client = LiztoClient(settings.lizto_email, settings.lizto_password)
    client.login()
    staff = client.get_staff()
    
    # Filtrar solo el staff asociado a esa sede
    if staff:
        staff = [s for s in staff if location_id in (s.get("allowed_locations_ids") or [])]
        
    return {"items": staff}

@router.get("/services")
def listar_services_lizto():
    """Contacta Lizto para traer la lista de servicios y sus variantes de precio."""
    if not settings.lizto_email or not settings.lizto_password:
         raise HTTPException(status_code=500, detail="Credenciales Lizto no configuradas")
         
    client = LiztoClient(settings.lizto_email, settings.lizto_password)
    client.login()
    services = client.get_services()
    return {"items": services}

# 5. Configuración global
@router.get("/config")
def listar_config(db: Session = Depends(get_db)):
    configs = db.query(LiztoConfig).all()
    return {c.key: c.value for c in configs}

@router.put("/config")
def actualizar_config(config_in: ConfigInput, db: Session = Depends(get_db)):
    config_entry = db.query(LiztoConfig).filter(LiztoConfig.key == config_in.key).first()
    if config_entry:
        config_entry.value = config_in.value
    else:
        config_entry = LiztoConfig(key=config_in.key, value=config_in.value)
        db.add(config_entry)
        
    db.commit()
    return {"success": True, "key": config_in.key, "value": config_in.value}
