from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Optional

from ..models.servicio import CategoriaServicio, Servicio
from ..schemas.servicio import CategoriaServicioCreate, CategoriaServicioUpdate, CategoriaOrdenItem


class CategoriaServicioService:
    """
    Servicio para CRUD de categorías de servicio.
    Implementa las reglas de negocio RN-SER-005.
    """
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[CategoriaServicio]:
        """
        BE-CATSER-001: Listar todas las categorías ordenadas por orden_visualizacion
        """
        return db.query(CategoriaServicio)\
            .order_by(CategoriaServicio.orden_visualizacion)\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    @staticmethod
    def get_by_id(db: Session, categoria_id: int) -> Optional[CategoriaServicio]:
        """
        BE-CATSER-002: Obtener categoría por ID
        """
        return db.query(CategoriaServicio).filter(CategoriaServicio.id == categoria_id).first()
    
    @staticmethod
    def get_by_nombre(db: Session, nombre: str) -> Optional[CategoriaServicio]:
        """
        Obtener categoría por nombre (para validar unicidad)
        """
        return db.query(CategoriaServicio).filter(
            func.lower(CategoriaServicio.nombre) == func.lower(nombre)
        ).first()
    
    @staticmethod
    def create(db: Session, categoria: CategoriaServicioCreate) -> CategoriaServicio:
        """
        BE-CATSER-003: Crear categoría
        """
        # Verificar nombre único
        existing = CategoriaServicioService.get_by_nombre(db, categoria.nombre)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe una categoría con el nombre '{categoria.nombre}'"
            )
        
        # Si no se especifica orden, asignar el siguiente
        if categoria.orden_visualizacion is None or categoria.orden_visualizacion == 0:
            max_orden = db.query(func.max(CategoriaServicio.orden_visualizacion)).scalar() or 0
            orden = max_orden + 1
        else:
            orden = categoria.orden_visualizacion
        
        db_categoria = CategoriaServicio(
            nombre=categoria.nombre,
            descripcion=categoria.descripcion,
            orden_visualizacion=orden
        )
        
        db.add(db_categoria)
        db.commit()
        db.refresh(db_categoria)
        return db_categoria
    
    @staticmethod
    def update(db: Session, categoria_id: int, categoria: CategoriaServicioUpdate) -> CategoriaServicio:
        """
        BE-CATSER-004: Actualizar categoría
        """
        db_categoria = CategoriaServicioService.get_by_id(db, categoria_id)
        if not db_categoria:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Categoría no encontrada"
            )
        
        # Verificar nombre único si se está actualizando
        if categoria.nombre and categoria.nombre.lower() != db_categoria.nombre.lower():
            existing = CategoriaServicioService.get_by_nombre(db, categoria.nombre)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ya existe una categoría con el nombre '{categoria.nombre}'"
                )
        
        # Actualizar solo campos proporcionados
        update_data = categoria.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(db_categoria, field, value)
        
        db.commit()
        db.refresh(db_categoria)
        return db_categoria
    
    @staticmethod
    def delete(db: Session, categoria_id: int) -> None:
        """
        BE-CATSER-005: Eliminar categoría
        RN-SER-005: No eliminar categoría con servicios
        """
        db_categoria = CategoriaServicioService.get_by_id(db, categoria_id)
        if not db_categoria:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Categoría no encontrada"
            )
        
        # Verificar si tiene servicios asociados
        servicios_count = db.query(Servicio).filter(
            Servicio.categoria_id == categoria_id
        ).count()
        
        if servicios_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede eliminar la categoría porque tiene {servicios_count} servicio(s) asociado(s)"
            )
        
        db.delete(db_categoria)
        db.commit()
    
    @staticmethod
    def reordenar(db: Session, categorias: List[CategoriaOrdenItem]) -> List[CategoriaServicio]:
        """
        BE-CATSER-006: Reordenar categorías
        """
        for item in categorias:
            db_categoria = CategoriaServicioService.get_by_id(db, item.id)
            if db_categoria:
                db_categoria.orden_visualizacion = item.orden_visualizacion
        
        db.commit()
        return CategoriaServicioService.get_all(db)
