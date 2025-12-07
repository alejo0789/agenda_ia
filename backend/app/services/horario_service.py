from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import time
from fastapi import HTTPException, status

from ..models.especialista import HorarioEspecialista
from ..schemas.especialista import HorarioEspecialistaCreate, HorarioEspecialistaUpdate


class HorarioService:
    """Servicio para gestión de horarios semanales de especialistas"""

    @staticmethod
    def get_by_especialista(db: Session, especialista_id: int) -> List[HorarioEspecialista]:
        """Obtener todos los horarios de un especialista"""
        return db.query(HorarioEspecialista).filter(
            HorarioEspecialista.especialista_id == especialista_id
        ).order_by(HorarioEspecialista.dia_semana, HorarioEspecialista.hora_inicio).all()

    @staticmethod
    def create(db: Session, especialista_id: int, horario: HorarioEspecialistaCreate) -> HorarioEspecialista:
        """
        Crear nuevo horario
        RN-ESP-003: hora_fin > hora_inicio (validado en schema)
        RN-ESP-004: Sin solapamiento de horarios del mismo día
        """
        # Verificar solapamiento
        HorarioService._validar_solapamiento(db, especialista_id, horario.dia_semana, 
                                             horario.hora_inicio, horario.hora_fin)

        db_horario = HorarioEspecialista(
            especialista_id=especialista_id,
            **horario.model_dump()
        )
        db.add(db_horario)
        db.commit()
        db.refresh(db_horario)
        return db_horario

    @staticmethod
    def create_batch(db: Session, especialista_id: int, horarios: List[HorarioEspecialistaCreate]) -> List[HorarioEspecialista]:
        """
        Guardar múltiples horarios (batch)
        Reemplaza todos los horarios existentes del especialista
        """
        # Eliminar horarios existentes
        db.query(HorarioEspecialista).filter(
            HorarioEspecialista.especialista_id == especialista_id
        ).delete()

        # Crear nuevos horarios
        db_horarios = []
        for horario in horarios:
            # Validar solapamiento entre los nuevos horarios
            for existing in db_horarios:
                if existing.dia_semana == horario.dia_semana:
                    if HorarioService._hay_solapamiento(
                        horario.hora_inicio, horario.hora_fin,
                        existing.hora_inicio, existing.hora_fin
                    ):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Horarios solapados en día {horario.dia_semana}"
                        )

            db_horario = HorarioEspecialista(
                especialista_id=especialista_id,
                **horario.model_dump()
            )
            db_horarios.append(db_horario)

        db.add_all(db_horarios)
        db.commit()
        for horario in db_horarios:
            db.refresh(horario)
        return db_horarios

    @staticmethod
    def update(db: Session, horario_id: int, horario: HorarioEspecialistaUpdate) -> HorarioEspecialista:
        """Actualizar horario existente"""
        db_horario = db.query(HorarioEspecialista).filter(HorarioEspecialista.id == horario_id).first()
        if not db_horario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Horario no encontrado"
            )

        update_data = horario.model_dump(exclude_unset=True)

        # Si se actualizan las horas, validar solapamiento
        if "hora_inicio" in update_data or "hora_fin" in update_data or "dia_semana" in update_data:
            nuevo_dia = update_data.get("dia_semana", db_horario.dia_semana)
            nueva_hora_inicio = update_data.get("hora_inicio", db_horario.hora_inicio)
            nueva_hora_fin = update_data.get("hora_fin", db_horario.hora_fin)

            # Validar hora_fin > hora_inicio
            if nueva_hora_fin <= nueva_hora_inicio:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="hora_fin debe ser mayor que hora_inicio"
                )

            HorarioService._validar_solapamiento(
                db, db_horario.especialista_id, nuevo_dia,
                nueva_hora_inicio, nueva_hora_fin, horario_id
            )

        for field, value in update_data.items():
            setattr(db_horario, field, value)

        db.commit()
        db.refresh(db_horario)
        return db_horario

    @staticmethod
    def delete(db: Session, horario_id: int) -> bool:
        """Eliminar horario"""
        db_horario = db.query(HorarioEspecialista).filter(HorarioEspecialista.id == horario_id).first()
        if not db_horario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Horario no encontrado"
            )

        db.delete(db_horario)
        db.commit()
        return True

    @staticmethod
    def _validar_solapamiento(db: Session, especialista_id: int, dia_semana: int, 
                              hora_inicio: time, hora_fin: time, excluir_id: int = None):
        """
        Validar que no haya solapamiento de horarios
        RN-ESP-004: Sin solapamiento de horarios del mismo día
        """
        query = db.query(HorarioEspecialista).filter(
            and_(
                HorarioEspecialista.especialista_id == especialista_id,
                HorarioEspecialista.dia_semana == dia_semana,
                HorarioEspecialista.activo == True
            )
        )

        if excluir_id:
            query = query.filter(HorarioEspecialista.id != excluir_id)

        horarios_existentes = query.all()

        for horario in horarios_existentes:
            if HorarioService._hay_solapamiento(hora_inicio, hora_fin, 
                                               horario.hora_inicio, horario.hora_fin):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El horario se solapa con otro horario existente del día {dia_semana}"
                )

    @staticmethod
    def _hay_solapamiento(inicio1: time, fin1: time, inicio2: time, fin2: time) -> bool:
        """Verificar si dos rangos de tiempo se solapan"""
        return not (fin1 <= inicio2 or fin2 <= inicio1)
