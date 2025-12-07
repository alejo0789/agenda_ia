from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, desc
from typing import List, Optional
from datetime import date
from fastapi import HTTPException, status

from ..models.cliente import Cliente, ClientePreferencia, ClienteEtiqueta, ClienteEtiquetaAsignacion
from ..schemas.cliente import (
    ClienteCreate, ClienteUpdate,
    ClientePreferenciaUpdate,
    ClienteEtiquetaCreate, ClienteEtiquetaUpdate,
    EtiquetaSimple
)


class ClienteService:
    """Servicio para gestión de clientes con validaciones de reglas de negocio"""

    # ============================================
    # CRUD DE CLIENTES
    # ============================================

    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        estado: Optional[str] = None,
        query: Optional[str] = None,
        etiqueta_id: Optional[int] = None
    ) -> List[Cliente]:
        """Listar todos los clientes con filtros opcionales"""
        q = db.query(Cliente)
        
        # Filtro por estado
        if estado and estado != 'todos':
            q = q.filter(Cliente.estado == estado)
        
        # Búsqueda por texto
        if query:
            search_term = f"%{query}%"
            q = q.filter(
                or_(
                    Cliente.nombre.ilike(search_term),
                    Cliente.apellido.ilike(search_term),
                    Cliente.telefono.ilike(search_term),
                    Cliente.email.ilike(search_term)
                )
            )
        
        # Filtro por etiqueta
        if etiqueta_id:
            q = q.join(ClienteEtiquetaAsignacion).filter(
                ClienteEtiquetaAsignacion.etiqueta_id == etiqueta_id
            )
        
        return q.order_by(Cliente.nombre, Cliente.apellido).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_paginado(
        db: Session,
        query: Optional[str] = None,
        estado: str = 'activo',
        etiqueta_id: Optional[int] = None,
        min_visitas: Optional[int] = None,
        max_visitas: Optional[int] = None,
        pagina: int = 1,
        por_pagina: int = 20,
        ordenar_por: str = 'nombre',
        orden: str = 'asc'
    ) -> dict:
        """Lista clientes con filtros, búsqueda y paginación"""
        q = db.query(Cliente)
        
        # Filtro por estado
        if estado != 'todos':
            q = q.filter(Cliente.estado == estado)
        
        # Búsqueda por texto
        if query:
            search_term = f"%{query}%"
            q = q.filter(
                or_(
                    Cliente.nombre.ilike(search_term),
                    Cliente.apellido.ilike(search_term),
                    Cliente.telefono.ilike(search_term),
                    Cliente.email.ilike(search_term)
                )
            )
        
        # Filtro por etiqueta
        if etiqueta_id:
            q = q.join(ClienteEtiquetaAsignacion).filter(
                ClienteEtiquetaAsignacion.etiqueta_id == etiqueta_id
            )
        
        # Filtro por rango de visitas
        if min_visitas is not None:
            q = q.filter(Cliente.total_visitas >= min_visitas)
        if max_visitas is not None:
            q = q.filter(Cliente.total_visitas <= max_visitas)
        
        # Total de registros
        total = q.count()
        
        # Ordenamiento
        if hasattr(Cliente, ordenar_por):
            campo_orden = getattr(Cliente, ordenar_por)
            if orden == 'desc':
                q = q.order_by(desc(campo_orden))
            else:
                q = q.order_by(campo_orden)
        else:
            q = q.order_by(Cliente.nombre, Cliente.apellido)
        
        # Paginación
        offset = (pagina - 1) * por_pagina
        clientes = q.offset(offset).limit(por_pagina).all()
        
        # Calcular total de páginas
        total_paginas = (total + por_pagina - 1) // por_pagina
        
        # Cargar etiquetas para cada cliente
        items = []
        for cliente in clientes:
            etiquetas = ClienteService._get_etiquetas_cliente(db, cliente.id)
            items.append({
                "id": cliente.id,
                "nombre": cliente.nombre,
                "apellido": cliente.apellido,
                "telefono": cliente.telefono,
                "email": cliente.email,
                "total_visitas": cliente.total_visitas or 0,
                "ultima_visita": cliente.ultima_visita,
                "etiquetas": etiquetas,
                "estado": cliente.estado
            })
        
        return {
            'total': total,
            'pagina': pagina,
            'por_pagina': por_pagina,
            'total_paginas': total_paginas,
            'items': items
        }

    @staticmethod
    def get_activos(db: Session) -> List[Cliente]:
        """Listar solo clientes activos"""
        return db.query(Cliente).filter(Cliente.estado == "activo").order_by(Cliente.nombre, Cliente.apellido).all()

    @staticmethod
    def get_by_id(db: Session, cliente_id: int) -> Optional[Cliente]:
        """Obtener cliente por ID"""
        return db.query(Cliente).filter(Cliente.id == cliente_id).first()

    @staticmethod
    def get_by_id_completo(db: Session, cliente_id: int) -> Optional[dict]:
        """Obtener cliente por ID con etiquetas cargadas"""
        cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            return None
        
        etiquetas = ClienteService._get_etiquetas_cliente(db, cliente_id)
        
        return {
            "id": cliente.id,
            "nombre": cliente.nombre,
            "apellido": cliente.apellido,
            "telefono": cliente.telefono,
            "email": cliente.email,
            "fecha_nacimiento": cliente.fecha_nacimiento,
            "direccion": cliente.direccion,
            "notas": cliente.notas,
            "estado": cliente.estado,
            "total_visitas": cliente.total_visitas or 0,
            "fecha_primera_visita": cliente.fecha_primera_visita,
            "ultima_visita": cliente.ultima_visita,
            "etiquetas": etiquetas,
            "fecha_creacion": cliente.fecha_creacion,
            "fecha_actualizacion": cliente.fecha_actualizacion
        }

    @staticmethod
    def _get_etiquetas_cliente(db: Session, cliente_id: int) -> List[dict]:
        """Obtener etiquetas de un cliente"""
        asignaciones = db.query(ClienteEtiquetaAsignacion).filter(
            ClienteEtiquetaAsignacion.cliente_id == cliente_id
        ).all()
        
        etiquetas = []
        for asig in asignaciones:
            etiqueta = db.query(ClienteEtiqueta).filter(ClienteEtiqueta.id == asig.etiqueta_id).first()
            if etiqueta:
                etiquetas.append({
                    "id": etiqueta.id,
                    "nombre": etiqueta.nombre,
                    "color": etiqueta.color
                })
        return etiquetas

    @staticmethod
    def create(db: Session, cliente: ClienteCreate) -> Cliente:
        """
        Crear nuevo cliente
        RN-CLI-001: Email único si se proporciona
        """
        # Validar email único si se proporciona
        if cliente.email:
            existing = db.query(Cliente).filter(
                Cliente.email == cliente.email
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ya existe un cliente con el email {cliente.email}"
                )
        
        # Validar teléfono único si se proporciona (opcional, depende de reglas de negocio)
        if cliente.telefono:
            existing = db.query(Cliente).filter(
                Cliente.telefono == cliente.telefono
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ya existe un cliente con el teléfono {cliente.telefono}"
                )

        # Crear cliente
        db_cliente = Cliente(**cliente.model_dump())
        db.add(db_cliente)
        db.flush()  # Para obtener el ID
        
        # Crear registro de preferencias vacío
        preferencia = ClientePreferencia(cliente_id=db_cliente.id)
        db.add(preferencia)
        
        db.commit()
        db.refresh(db_cliente)
        return db_cliente

    @staticmethod
    def update(db: Session, cliente_id: int, cliente: ClienteUpdate) -> Cliente:
        """
        Actualizar cliente
        RN-CLI-001: Email único
        """
        db_cliente = ClienteService.get_by_id(db, cliente_id)
        if not db_cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado"
            )

        update_data = cliente.model_dump(exclude_unset=True)

        # Validar email único si se está actualizando
        if "email" in update_data and update_data["email"]:
            existing = db.query(Cliente).filter(
                and_(
                    Cliente.email == update_data["email"],
                    Cliente.id != cliente_id
                )
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ya existe un cliente con el email {update_data['email']}"
                )

        # Validar teléfono único si se está actualizando
        if "telefono" in update_data and update_data["telefono"]:
            existing = db.query(Cliente).filter(
                and_(
                    Cliente.telefono == update_data["telefono"],
                    Cliente.id != cliente_id
                )
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ya existe un cliente con el teléfono {update_data['telefono']}"
                )

        for field, value in update_data.items():
            setattr(db_cliente, field, value)

        db.commit()
        db.refresh(db_cliente)
        return db_cliente

    @staticmethod
    def delete(db: Session, cliente_id: int) -> bool:
        """
        Desactivar cliente (soft delete)
        RN-CLI-002: No eliminar con citas futuras pendientes
        """
        db_cliente = ClienteService.get_by_id(db, cliente_id)
        if not db_cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado"
            )

        # TODO: Verificar si tiene citas futuras pendientes
        # from ..models.cita import Cita
        # citas_futuras = db.query(Cita).filter(
        #     and_(
        #         Cita.cliente_id == cliente_id,
        #         Cita.fecha >= date.today(),
        #         Cita.estado.in_(['agendada', 'confirmada'])
        #     )
        # ).count()
        # 
        # if citas_futuras > 0:
        #     raise HTTPException(
        #         status_code=status.HTTP_400_BAD_REQUEST,
        #         detail=f"No se puede desactivar el cliente porque tiene {citas_futuras} citas futuras pendientes"
        #     )

        # Soft delete: cambiar estado a inactivo
        db_cliente.estado = "inactivo"
        db.commit()
        return True

    @staticmethod
    def reactivar(db: Session, cliente_id: int) -> Cliente:
        """Reactivar un cliente desactivado"""
        db_cliente = ClienteService.get_by_id(db, cliente_id)
        if not db_cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado"
            )

        db_cliente.estado = "activo"
        db.commit()
        db.refresh(db_cliente)
        return db_cliente

    @staticmethod
    def busqueda_rapida(db: Session, query: str, limite: int = 10) -> List[Cliente]:
        """Búsqueda rápida para autocompletado"""
        search_term = f"%{query}%"
        return db.query(Cliente).filter(
            and_(
                Cliente.estado == 'activo',
                or_(
                    Cliente.nombre.ilike(search_term),
                    Cliente.apellido.ilike(search_term),
                    Cliente.telefono.ilike(search_term)
                )
            )
        ).order_by(Cliente.nombre).limit(limite).all()

    # ============================================
    # PREFERENCIAS
    # ============================================

    @staticmethod
    def get_preferencias(db: Session, cliente_id: int) -> Optional[ClientePreferencia]:
        """Obtener o crear preferencias del cliente"""
        # Verificar que el cliente existe
        cliente = ClienteService.get_by_id(db, cliente_id)
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado"
            )
        
        preferencia = db.query(ClientePreferencia).filter(
            ClientePreferencia.cliente_id == cliente_id
        ).first()
        
        if not preferencia:
            # Crear preferencias por defecto
            preferencia = ClientePreferencia(cliente_id=cliente_id)
            db.add(preferencia)
            db.commit()
            db.refresh(preferencia)
        
        return preferencia

    @staticmethod
    def update_preferencias(
        db: Session,
        cliente_id: int,
        preferencias_data: ClientePreferenciaUpdate
    ) -> ClientePreferencia:
        """Actualizar preferencias del cliente"""
        preferencia = ClienteService.get_preferencias(db, cliente_id)
        
        update_dict = preferencias_data.model_dump(exclude_unset=True)
        
        for campo, valor in update_dict.items():
            setattr(preferencia, campo, valor)
        
        db.commit()
        db.refresh(preferencia)
        return preferencia

    # ============================================
    # ETIQUETAS
    # ============================================

    @staticmethod
    def get_all_etiquetas(db: Session, incluir_totales: bool = True) -> List[dict]:
        """Lista todas las etiquetas con conteos opcionales"""
        etiquetas = db.query(ClienteEtiqueta).order_by(ClienteEtiqueta.nombre).all()
        
        result = []
        for etiqueta in etiquetas:
            item = {
                "id": etiqueta.id,
                "nombre": etiqueta.nombre,
                "color": etiqueta.color,
                "fecha_creacion": etiqueta.fecha_creacion,
                "total_clientes": 0
            }
            
            if incluir_totales:
                item["total_clientes"] = db.query(ClienteEtiquetaAsignacion).filter(
                    ClienteEtiquetaAsignacion.etiqueta_id == etiqueta.id
                ).count()
            
            result.append(item)
        
        return result

    @staticmethod
    def create_etiqueta(db: Session, etiqueta: ClienteEtiquetaCreate) -> ClienteEtiqueta:
        """Crear nueva etiqueta"""
        # Validar nombre único
        existing = db.query(ClienteEtiqueta).filter(
            ClienteEtiqueta.nombre == etiqueta.nombre
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe una etiqueta con el nombre '{etiqueta.nombre}'"
            )
        
        db_etiqueta = ClienteEtiqueta(**etiqueta.model_dump())
        db.add(db_etiqueta)
        db.commit()
        db.refresh(db_etiqueta)
        return db_etiqueta

    @staticmethod
    def update_etiqueta(db: Session, etiqueta_id: int, etiqueta: ClienteEtiquetaUpdate) -> ClienteEtiqueta:
        """Actualizar etiqueta"""
        db_etiqueta = db.query(ClienteEtiqueta).filter(ClienteEtiqueta.id == etiqueta_id).first()
        if not db_etiqueta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Etiqueta no encontrada"
            )
        
        update_data = etiqueta.model_dump(exclude_unset=True)
        
        # Validar nombre único si se está actualizando
        if "nombre" in update_data:
            existing = db.query(ClienteEtiqueta).filter(
                and_(
                    ClienteEtiqueta.nombre == update_data["nombre"],
                    ClienteEtiqueta.id != etiqueta_id
                )
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ya existe una etiqueta con el nombre '{update_data['nombre']}'"
                )
        
        for field, value in update_data.items():
            setattr(db_etiqueta, field, value)
        
        db.commit()
        db.refresh(db_etiqueta)
        return db_etiqueta

    @staticmethod
    def delete_etiqueta(db: Session, etiqueta_id: int) -> bool:
        """Eliminar etiqueta (se eliminan automáticamente las asignaciones por CASCADE)"""
        db_etiqueta = db.query(ClienteEtiqueta).filter(ClienteEtiqueta.id == etiqueta_id).first()
        if not db_etiqueta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Etiqueta no encontrada"
            )
        
        db.delete(db_etiqueta)
        db.commit()
        return True

    # ============================================
    # ASIGNACIÓN DE ETIQUETAS A CLIENTES
    # ============================================

    @staticmethod
    def asignar_etiquetas(db: Session, cliente_id: int, etiqueta_ids: List[int]) -> Cliente:
        """Asignar etiquetas a un cliente"""
        cliente = ClienteService.get_by_id(db, cliente_id)
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado"
            )
        
        for etiqueta_id in etiqueta_ids:
            # Verificar que la etiqueta existe
            etiqueta = db.query(ClienteEtiqueta).filter(ClienteEtiqueta.id == etiqueta_id).first()
            if not etiqueta:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Etiqueta con ID {etiqueta_id} no encontrada"
                )
            
            # Verificar si ya está asignada
            existing = db.query(ClienteEtiquetaAsignacion).filter(
                and_(
                    ClienteEtiquetaAsignacion.cliente_id == cliente_id,
                    ClienteEtiquetaAsignacion.etiqueta_id == etiqueta_id
                )
            ).first()
            
            if not existing:
                asignacion = ClienteEtiquetaAsignacion(
                    cliente_id=cliente_id,
                    etiqueta_id=etiqueta_id
                )
                db.add(asignacion)
        
        db.commit()
        db.refresh(cliente)
        return cliente

    @staticmethod
    def remover_etiqueta(db: Session, cliente_id: int, etiqueta_id: int) -> bool:
        """Remover una etiqueta de un cliente"""
        asignacion = db.query(ClienteEtiquetaAsignacion).filter(
            and_(
                ClienteEtiquetaAsignacion.cliente_id == cliente_id,
                ClienteEtiquetaAsignacion.etiqueta_id == etiqueta_id
            )
        ).first()
        
        if not asignacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asociación no encontrada"
            )
        
        db.delete(asignacion)
        db.commit()
        return True
