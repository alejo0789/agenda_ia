from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
import uuid

from ..models.ficha_tecnica import PlantillaFicha, CampoFicha, CitaFicha, RespuestaFicha
from ..models.cita import Cita
from ..schemas.ficha_tecnica import (
    PlantillaFichaCreate, PlantillaFichaUpdate,
    CampoFichaCreate, CampoFichaUpdate,
    CitaFichaCreate, FormularioPublicoSubmit
)
from datetime import datetime
from sqlalchemy.sql import func

class FichaTecnicaService:

    # ==========================
    # PLANTILLAS
    # ==========================

    @staticmethod
    def crear_plantilla(db: Session, plantilla_data: PlantillaFichaCreate) -> PlantillaFicha:
        # 1. Crear plantilla base
        db_plantilla = PlantillaFicha(
            nombre=plantilla_data.nombre,
            descripcion=plantilla_data.descripcion,
            activa=plantilla_data.activa,
            sede_id=plantilla_data.sede_id
        )
        db.add(db_plantilla)
        db.flush() # Para obtener el ID

        # 2. Agregar campos asociados
        for i, campo_data in enumerate(plantilla_data.campos):
            db_campo = CampoFicha(
                plantilla_id=db_plantilla.id,
                nombre=campo_data.nombre,
                tipo=campo_data.tipo,
                opciones=campo_data.opciones,
                requerido=campo_data.requerido,
                orden=campo_data.orden if campo_data.orden != 0 else i
            )
            db.add(db_campo)
        
        db.commit()
        db.refresh(db_plantilla)
        return db_plantilla

    @staticmethod
    def obtener_plantillas(db: Session, activa: Optional[bool] = None, sede_id: Optional[int] = None) -> List[PlantillaFicha]:
        query = db.query(PlantillaFicha)
        if activa is not None:
            query = query.filter(PlantillaFicha.activa == activa)
        if sede_id is not None:
            # Plantillas globales (sede_id=None) o de la sede específica
            query = query.filter((PlantillaFicha.sede_id == sede_id) | (PlantillaFicha.sede_id.is_(None)))
            
        return query.order_by(PlantillaFicha.id.desc()).all()

    @staticmethod
    def obtener_plantilla_por_id(db: Session, id_plantilla: int) -> Optional[PlantillaFicha]:
        return db.query(PlantillaFicha).filter(PlantillaFicha.id == id_plantilla).first()

    @staticmethod
    def actualizar_plantilla(db: Session, id_plantilla: int, plantilla_data: PlantillaFichaUpdate) -> Optional[PlantillaFicha]:
        db_plantilla = FichaTecnicaService.obtener_plantilla_por_id(db, id_plantilla)
        if not db_plantilla:
            return None
            
        update_data = plantilla_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_plantilla, key, value)
            
        db.commit()
        db.refresh(db_plantilla)
        return db_plantilla


    # ==========================
    # CAMPOS DE PLANTILLA (CRUD si es necesario modificar después)
    # ==========================
    
    @staticmethod
    def agregar_campo(db: Session, campo_data: CampoFichaCreate, plantilla_id: int) -> CampoFicha:
        db_campo = CampoFicha(
            plantilla_id=plantilla_id,
            nombre=campo_data.nombre,
            tipo=campo_data.tipo,
            opciones=campo_data.opciones,
            requerido=campo_data.requerido,
            orden=campo_data.orden
        )
        db.add(db_campo)
        db.commit()
        db.refresh(db_campo)
        return db_campo
        
    @staticmethod
    def eliminar_campo(db: Session, campo_id: int) -> bool:
        db_campo = db.query(CampoFicha).filter(CampoFicha.id == campo_id).first()
        if not db_campo:
            return False
        db.delete(db_campo)
        db.commit()
        return True


    # ==========================
    # CITA-FICHA (Vincular y Estado)
    # ==========================
    
    @staticmethod
    def vincular_ficha_a_cita(db: Session, cita_ficha_data: CitaFichaCreate) -> CitaFicha:
        # Validar si existe la cita
        cita = db.query(Cita).filter(Cita.id == cita_ficha_data.cita_id).first()
        if not cita:
            raise ValueError("La cita proporcionada no existe")
            
        # Validar si existe la plantilla
        plantilla = db.query(PlantillaFicha).filter(PlantillaFicha.id == cita_ficha_data.plantilla_id).first()
        if not plantilla:
            raise ValueError("La plantilla proporcionada no existe")
            
        # Verificar que no esté vinculada ya
        existente = db.query(CitaFicha).filter(
            CitaFicha.cita_id == cita_ficha_data.cita_id,
            CitaFicha.plantilla_id == cita_ficha_data.plantilla_id
        ).first()
        if existente:
            return existente # Si ya existe, retornar la misma
            
        db_cita_ficha = CitaFicha(
            cita_id=cita_ficha_data.cita_id,
            plantilla_id=cita_ficha_data.plantilla_id,
            estado="pendiente",
            token_publico=str(uuid.uuid4())
        )
        db.add(db_cita_ficha)
        db.commit()
        db.refresh(db_cita_ficha)
        db_cita_ficha.plantilla_nombre = plantilla.nombre # Para el schema de respuesta
        return db_cita_ficha

    @staticmethod
    def obtener_fichas_por_cita(db: Session, cita_id: int) -> List[CitaFicha]:
        cita_fichas = db.query(CitaFicha).filter(CitaFicha.cita_id == cita_id).all()
        # Enriquecer con el nombre de la plantilla
        for cf in cita_fichas:
            cf.plantilla_nombre = cf.plantilla.nombre
        return cita_fichas

    @staticmethod
    def marcar_como_enviada(db: Session, cita_ficha_id: int) -> Optional[CitaFicha]:
        cf = db.query(CitaFicha).filter(CitaFicha.id == cita_ficha_id).first()
        if not cf:
            return None
        cf.estado = "enviada"
        cf.fecha_envio = func.now()
        cf.plantilla_nombre = cf.plantilla.nombre
        db.commit()
        db.refresh(cf)
        return cf


    # ==========================
    # PUBLIC (Diligenciar Fichas)
    # ==========================
    
    @staticmethod
    def obtener_formulario_publico(db: Session, token: str) -> Optional[dict]:
        cf = db.query(CitaFicha).filter(CitaFicha.token_publico == token).first()
        if not cf:
            return None
            
        plantilla = cf.plantilla
        
        # Estructurar respuesta con la info que necesita el formulario público
        return {
            "cita_ficha_id": cf.id,
            "estado": cf.estado,
            "fecha_creacion": cf.fecha_creacion,
            "plantilla": {
                "id": plantilla.id,
                "nombre": plantilla.nombre,
                "descripcion": plantilla.descripcion,
                "campos": [
                    {
                        "id": c.id,
                        "nombre": c.nombre,
                        "tipo": c.tipo,
                        "opciones": c.opciones.split(',') if c.opciones else [],
                        "requerido": c.requerido,
                        "orden": c.orden
                    } for c in plantilla.campos
                ]
            }
        }

    @staticmethod
    def guardar_respuestas_formulario(db: Session, token: str, envio_data: FormularioPublicoSubmit) -> bool:
        cf = db.query(CitaFicha).filter(CitaFicha.token_publico == token).first()
        if not cf:
            raise ValueError("Token inválido o expirado")
            
        if cf.estado == "diligenciada":
            # Si quiere reescribir se permite (o se podrían borrar las viejas primero)
            db.query(RespuestaFicha).filter(RespuestaFicha.cita_ficha_id == cf.id).delete()
            
        # Limpiar respuestas viejas por si acaso
        db.query(RespuestaFicha).filter(RespuestaFicha.cita_ficha_id == cf.id).delete()
            
        for resp in envio_data.respuestas:
            db_resp = RespuestaFicha(
                cita_ficha_id=cf.id,
                campo_id=resp.campo_id,
                valor=resp.valor
            )
            db.add(db_resp)
            
        # Cambiar el estado
        cf.estado = "diligenciada"
        cf.fecha_diligenciamiento = func.now()
        
        db.commit()
        return True
