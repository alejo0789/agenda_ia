from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from ..models.descuento import Descuento
from ..schemas.descuento import DescuentoCreate, DescuentoUpdate
from fastapi import HTTPException, status

class DescuentoService:

    @staticmethod
    def get_all(
        db: Session, 
        skip: int = 0, 
        limit: int = 100, 
        activo: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[Descuento]:
        q = db.query(Descuento)
        
        if activo is not None:
            q = q.filter(Descuento.activo == activo)
            
        if search:
            search_pattern = f"%{search}%"
            q = q.filter(
                or_(
                    Descuento.nombre.ilike(search_pattern),
                    Descuento.codigo.ilike(search_pattern)
                )
            )
            
        return q.offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, descuento_id: int) -> Optional[Descuento]:
        return db.query(Descuento).filter(Descuento.id == descuento_id).first()

    @staticmethod
    def create(db: Session, descuento: DescuentoCreate) -> Descuento:
        # Check code uniqueness if provided
        if descuento.codigo:
            existing = db.query(Descuento).filter(Descuento.codigo == descuento.codigo).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El código '{descuento.codigo}' ya existe"
                )

        db_descuento = Descuento(**descuento.model_dump())
        db.add(db_descuento)
        db.commit()
        db.refresh(db_descuento)
        return db_descuento

    @staticmethod
    def update(db: Session, descuento_id: int, descuento: DescuentoUpdate) -> Descuento:
        db_descuento = DescuentoService.get_by_id(db, descuento_id)
        if not db_descuento:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Descuento no encontrado"
            )

        update_data = descuento.model_dump(exclude_unset=True)
        
        # Check code uniqueness
        if 'codigo' in update_data and update_data['codigo']:
            existing = db.query(Descuento).filter(Descuento.codigo == update_data['codigo']).first()
            if existing and existing.id != descuento_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El código '{update_data['codigo']}' ya existe"
                )

        for key, value in update_data.items():
            setattr(db_descuento, key, value)

        db.commit()
        db.refresh(db_descuento)
        return db_descuento

    @staticmethod
    def delete(db: Session, descuento_id: int):
        db_descuento = DescuentoService.get_by_id(db, descuento_id)
        if not db_descuento:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Descuento no encontrado"
            )
            
        # Optional: Soft delete or check usage before delete
        # For now, hard delete is requested ("eliminar bonos"), 
        # but probably safer to just deactivate or check constraints.
        # User said "eliminar", so let's allow delete but maybe catch FK errors.
        try:
            db.delete(db_descuento)
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede eliminar el descuento porque está en uso."
            )

    @staticmethod
    def get_validos(db: Session, sede_id: int = None) -> List[Descuento]:
        """Obtener descuentos activos y vigentes para una sede"""
        now = datetime.now()
        q = db.query(Descuento).filter(Descuento.activo == True)
        
        # Filter by date range
        q = q.filter(
            or_(Descuento.fecha_inicio.is_(None), Descuento.fecha_inicio <= now),
            or_(Descuento.fecha_fin.is_(None), Descuento.fecha_fin >= now)
        )
        
        # Filter by sede
        if sede_id:
            q = q.filter(or_(Descuento.sede_id.is_(None), Descuento.sede_id == sede_id))
            
        return q.all()
