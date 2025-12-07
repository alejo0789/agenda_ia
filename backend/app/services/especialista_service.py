from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import date, datetime
from fastapi import HTTPException, status

from ..models.especialista import Especialista, HorarioEspecialista, BloqueoEspecialista, EspecialistaServicio
from ..schemas.especialista import (
    EspecialistaCreate, EspecialistaUpdate,
    HorarioEspecialistaCreate, HorarioEspecialistaUpdate,
    BloqueoEspecialistaCreate, BloqueoEspecialistaUpdate,
    EspecialistaServicioCreate, EspecialistaServicioUpdate
)


class EspecialistaService:
    """Servicio para gestión de especialistas con validaciones de reglas de negocio"""

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, estado: Optional[str] = None) -> List[Especialista]:
        """Listar todos los especialistas con filtros opcionales"""
        query = db.query(Especialista)
        
        if estado:
            query = query.filter(Especialista.estado == estado)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_activos(db: Session) -> List[Especialista]:
        """Listar solo especialistas activos (para agenda)"""
        return db.query(Especialista).filter(Especialista.estado == "activo").all()

    @staticmethod
    def get_by_id(db: Session, especialista_id: int) -> Optional[Especialista]:
        """Obtener especialista por ID"""
        return db.query(Especialista).filter(Especialista.id == especialista_id).first()

    @staticmethod
    def create(db: Session, especialista: EspecialistaCreate) -> Especialista:
        """
        Crear nuevo especialista
        RN-ESP-001: Documento y email únicos
        """
        # Validar documento único
        if especialista.documento_identidad:
            existing = db.query(Especialista).filter(
                Especialista.documento_identidad == especialista.documento_identidad
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un especialista con ese documento de identidad"
                )

        # Validar email único
        if especialista.email:
            existing = db.query(Especialista).filter(
                Especialista.email == especialista.email
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un especialista con ese email"
                )

        db_especialista = Especialista(**especialista.model_dump())
        db.add(db_especialista)
        db.commit()
        db.refresh(db_especialista)
        return db_especialista

    @staticmethod
    def update(db: Session, especialista_id: int, especialista: EspecialistaUpdate) -> Especialista:
        """
        Actualizar especialista
        RN-ESP-001: Documento y email únicos
        """
        db_especialista = EspecialistaService.get_by_id(db, especialista_id)
        if not db_especialista:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Especialista no encontrado"
            )

        update_data = especialista.model_dump(exclude_unset=True)

        # Validar documento único si se está actualizando
        if "documento_identidad" in update_data and update_data["documento_identidad"]:
            existing = db.query(Especialista).filter(
                and_(
                    Especialista.documento_identidad == update_data["documento_identidad"],
                    Especialista.id != especialista_id
                )
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un especialista con ese documento de identidad"
                )

        # Validar email único si se está actualizando
        if "email" in update_data and update_data["email"]:
            existing = db.query(Especialista).filter(
                and_(
                    Especialista.email == update_data["email"],
                    Especialista.id != especialista_id
                )
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un especialista con ese email"
                )

        for field, value in update_data.items():
            setattr(db_especialista, field, value)

        db.commit()
        db.refresh(db_especialista)
        return db_especialista

    @staticmethod
    def delete(db: Session, especialista_id: int) -> bool:
        """
        Desactivar especialista (soft delete)
        RN-ESP-002: No eliminar con citas futuras pendientes
        """
        db_especialista = EspecialistaService.get_by_id(db, especialista_id)
        if not db_especialista:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Especialista no encontrado"
            )

        # Verificar si tiene citas futuras pendientes
        # TODO: Implementar cuando se cree el modelo de Citas
        # from ..models.cita import Cita
        # citas_futuras = db.query(Cita).filter(
        #     and_(
        #         Cita.especialista_id == especialista_id,
        #         Cita.fecha >= date.today(),
        #         Cita.estado.in_(['agendada', 'confirmada'])
        #     )
        # ).count()
        # 
        # if citas_futuras > 0:
        #     raise HTTPException(
        #         status_code=status.HTTP_400_BAD_REQUEST,
        #         detail=f"No se puede desactivar el especialista porque tiene {citas_futuras} citas futuras pendientes"
        #     )

        # Soft delete: cambiar estado a inactivo
        db_especialista.estado = "inactivo"
        db.commit()
        return True
