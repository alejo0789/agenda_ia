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
    def get_all(db: Session, sede_id: int, skip: int = 0, limit: int = 100, estado: Optional[str] = None) -> List[Especialista]:
        """Listar todos los especialistas de una sede con filtros opcionales"""
        query = db.query(Especialista).filter(Especialista.sede_id == sede_id)
        
        if estado:
            query = query.filter(Especialista.estado == estado)
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_activos(db: Session, sede_id: int) -> List[Especialista]:
        """Listar solo especialistas activos de una sede (para agenda)"""
        return db.query(Especialista).filter(and_(Especialista.estado == "activo", Especialista.sede_id == sede_id)).all()

    @staticmethod
    def get_by_id(db: Session, especialista_id: int) -> Optional[Especialista]:
        """Obtener especialista por ID"""
        return db.query(Especialista).filter(Especialista.id == especialista_id).first()

    @staticmethod
    def create(db: Session, especialista: EspecialistaCreate, admin_sede_id: Optional[int] = None) -> Especialista:
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

        db_especialista = Especialista(
            **especialista.model_dump(exclude={'crear_usuario'}),
            sede_id=admin_sede_id
        )
        db.add(db_especialista)
        db.commit()
        db.refresh(db_especialista)
        
        # AUTOMATIC USER CREATION
        # Check explicit flag or implicit desire (if email exists and not explicit False)
        should_create_user = getattr(especialista, 'crear_usuario', True)
        
        if should_create_user and especialista.email:
             from ..models.user import Usuario, Rol
             from ..services.password_service import PasswordService
             
             from sqlalchemy import func
             # Check if user exists
             existing_user = db.query(Usuario).filter(func.lower(Usuario.email) == func.lower(especialista.email)).first()
             if not existing_user:
                 # Find Specialist Role
                 rol_especialista = db.query(Rol).filter(Rol.nombre.ilike("%especialista%")).first()
                 
                 # If role not found, maybe fallback to standard user or log error? 
                 # We assume role exists. If not, we skip user creation to avoid breaking flow.
                 if rol_especialista:
                     # Generate username
                     base_username = especialista.email.split("@")[0]
                     username = base_username
                     counter = 1
                     from sqlalchemy import func
                     while db.query(Usuario).filter(func.lower(Usuario.username) == func.lower(username)).first():
                         username = f"{base_username}{counter}"
                         counter += 1
                     
                     # Create User
                     # Default password: "Especialista123!"
                     hashed = PasswordService.hash_password("Especialista123!")
                     
                     new_user = Usuario(
                         nombre=f"{especialista.nombre} {especialista.apellido}",
                         username=username,
                         email=especialista.email,
                         password_hash=hashed,
                         rol_id=rol_especialista.id,
                         especialista_id=db_especialista.id,
                         estado="activo",
                         primer_acceso=True,
                         requiere_cambio_password=True,
                         sede_id=admin_sede_id # Assigned to admin's sede
                     )
                     db.add(new_user)
                     db.commit()
             else:
                 # Link existing user if not linked
                 if not existing_user.especialista_id:
                     existing_user.especialista_id = db_especialista.id
                     db.commit()

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
