from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException, status

from ..models.especialista import BloqueoEspecialista
from ..schemas.especialista import BloqueoEspecialistaCreate, BloqueoEspecialistaUpdate


class BloqueoService:
    """Servicio para gestión de bloqueos puntuales y recurrentes"""

    @staticmethod
    def get_by_especialista(db: Session, especialista_id: int) -> List[BloqueoEspecialista]:
        """Listar todos los bloqueos de un especialista"""
        return db.query(BloqueoEspecialista).filter(
            BloqueoEspecialista.especialista_id == especialista_id
        ).order_by(BloqueoEspecialista.fecha_inicio).all()

    @staticmethod
    def get_by_id(db: Session, bloqueo_id: int) -> BloqueoEspecialista:
        """Obtener bloqueo por ID"""
        bloqueo = db.query(BloqueoEspecialista).filter(BloqueoEspecialista.id == bloqueo_id).first()
        if not bloqueo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bloqueo no encontrado"
            )
        return bloqueo

    @staticmethod
    def create(db: Session, especialista_id: int, bloqueo: BloqueoEspecialistaCreate) -> BloqueoEspecialista:
        """
        Crear nuevo bloqueo
        RN-ESP-005: Bloqueos recurrentes requieren días de semana (validado en schema)
        """
        # Validación adicional de bloqueos recurrentes
        if bloqueo.es_recurrente and not bloqueo.dias_semana:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los bloqueos recurrentes requieren especificar días de semana"
            )

        db_bloqueo = BloqueoEspecialista(
            especialista_id=especialista_id,
            **bloqueo.model_dump()
        )
        db.add(db_bloqueo)
        db.commit()
        db.refresh(db_bloqueo)
        return db_bloqueo

    @staticmethod
    def update(db: Session, bloqueo_id: int, bloqueo: BloqueoEspecialistaUpdate) -> BloqueoEspecialista:
        """Actualizar bloqueo existente"""
        db_bloqueo = BloqueoService.get_by_id(db, bloqueo_id)

        update_data = bloqueo.model_dump(exclude_unset=True)

        # Validar fecha_fin >= fecha_inicio si se actualizan las fechas
        if "fecha_inicio" in update_data or "fecha_fin" in update_data:
            nueva_fecha_inicio = update_data.get("fecha_inicio", db_bloqueo.fecha_inicio)
            nueva_fecha_fin = update_data.get("fecha_fin", db_bloqueo.fecha_fin)

            if nueva_fecha_fin < nueva_fecha_inicio:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="fecha_fin debe ser mayor o igual a fecha_inicio"
                )

        # Validar bloqueos recurrentes
        if "es_recurrente" in update_data or "dias_semana" in update_data:
            es_recurrente = update_data.get("es_recurrente", db_bloqueo.es_recurrente)
            dias_semana = update_data.get("dias_semana", db_bloqueo.dias_semana)

            if es_recurrente and not dias_semana:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Los bloqueos recurrentes requieren especificar días de semana"
                )

        for field, value in update_data.items():
            setattr(db_bloqueo, field, value)

        db.commit()
        db.refresh(db_bloqueo)
        return db_bloqueo

    @staticmethod
    def delete(db: Session, bloqueo_id: int) -> bool:
        """Eliminar bloqueo"""
        db_bloqueo = BloqueoService.get_by_id(db, bloqueo_id)
        db.delete(db_bloqueo)
        db.commit()
        return True
