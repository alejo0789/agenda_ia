from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from fastapi import HTTPException, status

from ..models.especialista import EspecialistaServicio
from ..schemas.especialista import EspecialistaServicioCreate, EspecialistaServicioUpdate


class ComisionEspecialistaService:
    """Servicio para gestión de comisiones por servicio del especialista"""

    @staticmethod
    def get_by_especialista(db: Session, especialista_id: int) -> List[EspecialistaServicio]:
        """Listar todos los servicios asignados a un especialista"""
        from sqlalchemy.orm import joinedload
        return db.query(EspecialistaServicio).options(joinedload(EspecialistaServicio.servicio)).filter(
            EspecialistaServicio.especialista_id == especialista_id
        ).all()

    @staticmethod
    def get_by_id(db: Session, especialista_id: int, servicio_id: int) -> EspecialistaServicio:
        """Obtener servicio específico de un especialista"""
        servicio = db.query(EspecialistaServicio).filter(
            and_(
                EspecialistaServicio.especialista_id == especialista_id,
                EspecialistaServicio.servicio_id == servicio_id
            )
        ).first()
        
        if not servicio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado para este especialista"
            )
        return servicio

    @staticmethod
    def create(db: Session, especialista_id: int, servicio: EspecialistaServicioCreate) -> EspecialistaServicio:
        """
        Asignar servicio a especialista con comisión
        RN-ESP-006: Comisión porcentaje entre 0 y 100 (validado en schema)
        """
        # Verificar si ya existe la asignación
        existing = db.query(EspecialistaServicio).filter(
            and_(
                EspecialistaServicio.especialista_id == especialista_id,
                EspecialistaServicio.servicio_id == servicio.servicio_id
            )
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El servicio ya está asignado a este especialista"
            )

        # Validar que el servicio existe
        from ..models.servicio import Servicio
        db_servicio = db.query(Servicio).filter(Servicio.id == servicio.servicio_id).first()
        if not db_servicio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado"
            )

        # Validar comisión porcentaje
        if servicio.tipo_comision == "porcentaje" and servicio.valor_comision > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El porcentaje de comisión no puede ser mayor a 100"
            )

        db_especialista_servicio = EspecialistaServicio(
            especialista_id=especialista_id,
            **servicio.model_dump()
        )
        db.add(db_especialista_servicio)
        db.commit()
        db.refresh(db_especialista_servicio)
        return db_especialista_servicio

    @staticmethod
    def update(db: Session, especialista_id: int, servicio_id: int, 
               servicio: EspecialistaServicioUpdate) -> EspecialistaServicio:
        """
        Actualizar comisión de un servicio
        RN-ESP-006: Comisión porcentaje entre 0 y 100
        """
        db_servicio = ComisionEspecialistaService.get_by_id(db, especialista_id, servicio_id)

        update_data = servicio.model_dump(exclude_unset=True)

        # Validar comisión porcentaje si se actualiza
        if "tipo_comision" in update_data or "valor_comision" in update_data:
            nuevo_tipo = update_data.get("tipo_comision", db_servicio.tipo_comision)
            nuevo_valor = update_data.get("valor_comision", db_servicio.valor_comision)

            if nuevo_tipo == "porcentaje" and nuevo_valor > 100:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El porcentaje de comisión no puede ser mayor a 100"
                )

        for field, value in update_data.items():
            setattr(db_servicio, field, value)

        db.commit()
        db.refresh(db_servicio)
        return db_servicio

    @staticmethod
    def delete(db: Session, especialista_id: int, servicio_id: int) -> bool:
        """Quitar servicio de un especialista"""
        db_servicio = ComisionEspecialistaService.get_by_id(db, especialista_id, servicio_id)
        db.delete(db_servicio)
        db.commit()
        return True
