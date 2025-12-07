from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime

from ..models.servicio import Servicio, CategoriaServicio
from ..schemas.servicio import ServicioCreate, ServicioUpdate, ServicioPorCategoriaResponse, ServicioResponse


class ServicioService:
    """
    Servicio para CRUD de servicios.
    Implementa las reglas de negocio RN-SER-001 a RN-SER-006.
    """
    
    @staticmethod
    def get_all(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        categoria_id: Optional[int] = None,
        estado: Optional[str] = None
    ) -> List[Servicio]:
        """
        BE-SER-001: Listar servicios con filtros opcionales
        """
        query = db.query(Servicio).options(joinedload(Servicio.categoria))
        
        if categoria_id:
            query = query.filter(Servicio.categoria_id == categoria_id)
        
        if estado:
            query = query.filter(Servicio.estado == estado)
        
        return query.order_by(Servicio.nombre).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, servicio_id: int) -> Optional[Servicio]:
        """
        BE-SER-002: Obtener servicio por ID
        """
        return db.query(Servicio)\
            .options(joinedload(Servicio.categoria))\
            .filter(Servicio.id == servicio_id)\
            .first()
    
    @staticmethod
    def create(db: Session, servicio: ServicioCreate) -> Servicio:
        """
        BE-SER-003: Crear servicio
        Valida RN-SER-001 (duración mínima), RN-SER-002 (múltiplo 15), 
        RN-SER-003 (precio >= 0), RN-SER-004 (color HEX)
        """
        # Verificar que la categoría existe si se proporciona
        if servicio.categoria_id:
            categoria = db.query(CategoriaServicio).filter(
                CategoriaServicio.id == servicio.categoria_id
            ).first()
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La categoría con ID {servicio.categoria_id} no existe"
                )
        
        db_servicio = Servicio(
            nombre=servicio.nombre,
            descripcion=servicio.descripcion,
            duracion_minutos=servicio.duracion_minutos,
            precio_base=servicio.precio_base,
            categoria_id=servicio.categoria_id,
            requiere_producto=servicio.requiere_producto,
            estado=servicio.estado,
            color_calendario=servicio.color_calendario
        )
        
        db.add(db_servicio)
        db.commit()
        db.refresh(db_servicio)
        return db_servicio
    
    @staticmethod
    def update(db: Session, servicio_id: int, servicio: ServicioUpdate) -> Servicio:
        """
        BE-SER-004: Actualizar servicio
        """
        db_servicio = ServicioService.get_by_id(db, servicio_id)
        if not db_servicio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado"
            )
        
        # Verificar que la categoría existe si se está actualizando
        if servicio.categoria_id is not None:
            categoria = db.query(CategoriaServicio).filter(
                CategoriaServicio.id == servicio.categoria_id
            ).first()
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La categoría con ID {servicio.categoria_id} no existe"
                )
        
        # Actualizar solo campos proporcionados
        update_data = servicio.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(db_servicio, field, value)
        
        db.commit()
        db.refresh(db_servicio)
        return db_servicio
    
    @staticmethod
    def delete(db: Session, servicio_id: int) -> None:
        """
        BE-SER-005: Desactivar servicio (soft delete)
        RN-SER-006: No eliminar servicio con citas futuras
        
        Nota: La validación de citas futuras se implementará cuando
        se cree el modelo de Citas. Por ahora, solo desactiva.
        """
        db_servicio = ServicioService.get_by_id(db, servicio_id)
        if not db_servicio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado"
            )
        
        # TODO: Verificar si tiene citas futuras pendientes
        # Esto se implementará cuando exista el modelo de Citas
        # citas_futuras = db.query(Cita).filter(
        #     Cita.servicio_id == servicio_id,
        #     Cita.fecha_inicio > datetime.now(),
        #     Cita.estado.in_(['agendada', 'confirmada'])
        # ).count()
        # 
        # if citas_futuras > 0:
        #     raise HTTPException(
        #         status_code=status.HTTP_400_BAD_REQUEST,
        #         detail=f"No se puede desactivar el servicio porque tiene {citas_futuras} cita(s) futura(s)"
        #     )
        
        db_servicio.estado = "inactivo"
        db.commit()
    
    @staticmethod
    def get_activos(db: Session) -> List[Servicio]:
        """
        Obtener solo servicios activos
        """
        return db.query(Servicio)\
            .options(joinedload(Servicio.categoria))\
            .filter(Servicio.estado == "activo")\
            .order_by(Servicio.nombre)\
            .all()
    
    @staticmethod
    def get_activos_por_categoria(db: Session) -> List[ServicioPorCategoriaResponse]:
        """
        BE-SER-006: Servicios activos agrupados por categoría
        """
        # Obtener todas las categorías ordenadas
        categorias = db.query(CategoriaServicio)\
            .order_by(CategoriaServicio.orden_visualizacion)\
            .all()
        
        # Obtener servicios activos
        servicios_activos = db.query(Servicio)\
            .filter(Servicio.estado == "activo")\
            .order_by(Servicio.nombre)\
            .all()
        
        # Agrupar servicios por categoría
        resultado = []
        
        # Primero las categorías definidas
        for categoria in categorias:
            servicios_categoria = [
                s for s in servicios_activos 
                if s.categoria_id == categoria.id
            ]
            if servicios_categoria:
                resultado.append(ServicioPorCategoriaResponse(
                    categoria_id=categoria.id,
                    categoria_nombre=categoria.nombre,
                    servicios=[ServicioResponse.model_validate(s) for s in servicios_categoria]
                ))
        
        # Servicios sin categoría
        servicios_sin_categoria = [
            s for s in servicios_activos 
            if s.categoria_id is None
        ]
        if servicios_sin_categoria:
            resultado.append(ServicioPorCategoriaResponse(
                categoria_id=None,
                categoria_nombre="Sin categoría",
                servicios=[ServicioResponse.model_validate(s) for s in servicios_sin_categoria]
            ))
        
        return resultado
    
    @staticmethod
    def activar(db: Session, servicio_id: int) -> Servicio:
        """
        Reactivar un servicio
        """
        db_servicio = ServicioService.get_by_id(db, servicio_id)
        if not db_servicio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado"
            )
        
        db_servicio.estado = "activo"
        db.commit()
        db.refresh(db_servicio)
        return db_servicio
