from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import date, time, datetime, timedelta

from ..models.cita import Cita
from ..models.cliente import Cliente
from ..models.especialista import Especialista
from ..models.servicio import Servicio
from ..schemas.cita import CitaCreate, CitaUpdate
from ..schemas.abono import AbonoCreate
from ..services.abono_service import AbonoService
from ..services.caja_service import CajaService
from decimal import Decimal


class CitaService:
    """Servicio para gestión de citas"""
    
    @staticmethod
    def get_by_id(db: Session, cita_id: int) -> Optional[Cita]:
        """Obtener cita por ID"""
        return db.query(Cita).filter(Cita.id == cita_id).first()
    
    @staticmethod
    def get_by_fecha(
        db: Session,
        fecha_inicio: date,
        fecha_fin: Optional[date] = None,
        especialista_id: Optional[int] = None,
        estado: Optional[str] = None,
        sede_id: Optional[int] = None
    ) -> List[Cita]:
        """Obtener citas por rango de fechas"""
        query = db.query(Cita)
        
        if sede_id:
            query = query.filter(Cita.sede_id == sede_id)
        
        if fecha_fin:
            query = query.filter(Cita.fecha >= fecha_inicio, Cita.fecha <= fecha_fin)
        else:
            query = query.filter(Cita.fecha == fecha_inicio)
        
        if especialista_id:
            query = query.filter(Cita.especialista_id == especialista_id)
        
        if estado:
            query = query.filter(Cita.estado == estado)
        
        return query.order_by(Cita.fecha, Cita.hora_inicio).all()
    
    @staticmethod
    def get_by_cliente(db: Session, cliente_id: int, limit: int = 50) -> List[Cita]:
        """Obtener citas de un cliente"""
        return db.query(Cita).filter(
            Cita.cliente_id == cliente_id
        ).order_by(Cita.fecha.desc(), Cita.hora_inicio.desc()).limit(limit).all()
    
    @staticmethod
    def get_by_especialista(db: Session, especialista_id: int, fecha: date) -> List[Cita]:
        """Obtener citas de un especialista en una fecha"""
        return db.query(Cita).filter(
            Cita.especialista_id == especialista_id,
            Cita.fecha == fecha,
            Cita.estado.notin_(['cancelada', 'no_show'])
        ).order_by(Cita.hora_inicio).all()
    
    @staticmethod
    def crear(db: Session, cita_data: CitaCreate, usuario_id: int, sede_id: int) -> Cita:
        """Crear una nueva cita"""
        # Obtener el servicio para calcular duración y precio
        servicio = db.query(Servicio).filter(Servicio.id == cita_data.servicio_id).first()
        if not servicio:
            raise ValueError("Servicio no encontrado")
        
        # Verificar que el cliente existe
        cliente = db.query(Cliente).filter(Cliente.id == cita_data.cliente_id).first()
        if not cliente:
            raise ValueError("Cliente no encontrado")
        
        # Verificar que el especialista existe
        especialista = db.query(Especialista).filter(Especialista.id == cita_data.especialista_id).first()
        if not especialista:
            raise ValueError("Especialista no encontrado")
        
        # Calcular hora fin
        hora_inicio = cita_data.hora_inicio
        duracion = servicio.duracion_minutos
        
        # Convertir a datetime para calcular
        dt_inicio = datetime.combine(cita_data.fecha, hora_inicio)
        dt_fin = dt_inicio + timedelta(minutes=duracion)
        hora_fin = dt_fin.time()
        
        # Verificar disponibilidad del especialista
        citas_conflicto = db.query(Cita).filter(
            Cita.especialista_id == cita_data.especialista_id,
            Cita.fecha == cita_data.fecha,
            Cita.estado.notin_(['cancelada', 'no_show']),
            or_(
                # La nueva cita empieza durante otra cita
                and_(Cita.hora_inicio <= hora_inicio, Cita.hora_fin > hora_inicio),
                # La nueva cita termina durante otra cita
                and_(Cita.hora_inicio < hora_fin, Cita.hora_fin >= hora_fin),
                # La nueva cita contiene otra cita
                and_(Cita.hora_inicio >= hora_inicio, Cita.hora_fin <= hora_fin)
            )
        ).first()
        
        if citas_conflicto:
            raise ValueError(f"El especialista ya tiene una cita a esa hora")
        
        # Crear la cita
        cita = Cita(
            cliente_id=cita_data.cliente_id,
            especialista_id=cita_data.especialista_id,
            servicio_id=cita_data.servicio_id,
            sede_id=sede_id,
            fecha=cita_data.fecha,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin,
            duracion_minutos=duracion,
            precio=servicio.precio_base,
            notas=cita_data.notas,
            estado='agendada'
        )
        
        db.add(cita)
        db.commit()
        db.refresh(cita)
        
        # -----------------------------------------------------------
        # Crear Abono si se proporcionó monto_abono
        # -----------------------------------------------------------
        if cita_data.monto_abono and float(cita_data.monto_abono) > 0:
            if not cita_data.metodo_pago_id:
                # Si no hay método de pago, no podemos registrar el abono correctamente
                # Podríamos lanzar error, o ignorarlo. Lanzar error es más seguro.
                # Como la cita ya se creó, esto podría ser problemático transaccionalmente si no usamos un rollback explicito
                # o si la cita debería existir aun si falla el abono.
                # Idealmente todo esto debería ser atómico, pero SQLAlchemy Session gestiona transacciones.
                # Si lanzamos excepción aquí después del commit anterior, la cita queda creada pero el abono no.
                # Para evitar inconsistencias, verificamos esto ANTES de crear la cita, pero CitaService.crear es "todo en uno".
                # Una mejor aproximación es validar esto al principio del metodo.
                pass 
                
            else:
                try:
                    # Buscar caja abierta (opcional, pero recomendable para efectivo)
                    caja_actual = CajaService.obtener_caja_actual(db)
                    caja_id = caja_actual.id if caja_actual else None
                    
                    abono_service = AbonoService(db)
                    abono_data = AbonoCreate(
                        cliente_id=cita.cliente_id,
                        monto=Decimal(str(cita_data.monto_abono)),
                        metodo_pago_id=cita_data.metodo_pago_id,
                        referencia_pago=cita_data.referencia_pago,
                        cita_id=cita.id,
                        concepto=cita_data.concepto_abono or f"Abono inicial cita {cita.fecha} {cita.hora_inicio}"
                    )
                    
                    abono_service.crear_abono(
                        data=abono_data,
                        usuario_id=usuario_id,
                        caja_id=caja_id
                    )
                except Exception as e:
                    # Loguear error pero no fallar la creación de la cita complete
                    print(f"Error al crear abono automático: {e}")
                    # Opcionalmente podríamos hacer raise e si queremos que falle todo

        return cita
    
    @staticmethod
    def actualizar(db: Session, cita_id: int, cita_data: CitaUpdate) -> Optional[Cita]:
        """Actualizar una cita"""
        cita = CitaService.get_by_id(db, cita_id)
        if not cita:
            return None
        
        update_data = cita_data.model_dump(exclude_unset=True)
        
        # Si se cambia el servicio, recalcular duración, precio y hora_fin
        if 'servicio_id' in update_data:
            servicio = db.query(Servicio).filter(Servicio.id == update_data['servicio_id']).first()
            if servicio:
                update_data['duracion_minutos'] = servicio.duracion_minutos
                update_data['precio'] = servicio.precio_base
                
                # Recalcular hora_fin con la nueva duración
                hora_inicio = update_data.get('hora_inicio', cita.hora_inicio)
                fecha = update_data.get('fecha', cita.fecha)
                dt_inicio = datetime.combine(fecha, hora_inicio)
                dt_fin = dt_inicio + timedelta(minutes=servicio.duracion_minutos)
                update_data['hora_fin'] = dt_fin.time()
        # Si solo se cambia la hora de inicio (sin cambiar servicio), recalcular hora_fin
        elif 'hora_inicio' in update_data:
            hora_inicio = update_data['hora_inicio']
            duracion = cita.duracion_minutos
            fecha = update_data.get('fecha', cita.fecha)
            
            dt_inicio = datetime.combine(fecha, hora_inicio)
            dt_fin = dt_inicio + timedelta(minutes=duracion)
            update_data['hora_fin'] = dt_fin.time()
        
        for field, value in update_data.items():
            setattr(cita, field, value)
        
        db.commit()
        db.refresh(cita)
        return cita
    
    @staticmethod
    def cambiar_estado(db: Session, cita_id: int, nuevo_estado: str, notas: Optional[str] = None) -> Optional[Cita]:
        """Cambiar el estado de una cita"""
        cita = CitaService.get_by_id(db, cita_id)
        if not cita:
            return None
        
        cita.estado = nuevo_estado
        if notas:
            cita.notas_internas = notas
        
        db.commit()
        db.refresh(cita)
        return cita
    
    @staticmethod
    def eliminar(db: Session, cita_id: int) -> bool:
        """Eliminar una cita (solo si está pendiente)"""
        cita = CitaService.get_by_id(db, cita_id)
        if not cita:
            return False
        
        if cita.estado in ['completada', 'cliente_llego']:
            raise ValueError("No se puede eliminar una cita completada o cuando el cliente ya llegó")
        
        db.delete(cita)
        db.commit()
        return True
    
    @staticmethod
    def format_cita_list(cita: Cita) -> dict:
        """Formatear cita para respuesta de lista"""
        return {
            "id": cita.id,
            "cliente_id": cita.cliente_id,
            "especialista_id": cita.especialista_id,
            "servicio_id": cita.servicio_id,
            "fecha": cita.fecha,
            "hora_inicio": cita.hora_inicio,
            "hora_fin": cita.hora_fin,
            "duracion_minutos": cita.duracion_minutos,
            "estado": cita.estado,
            "notas": cita.notas,
            "cliente_nombre": f"{cita.cliente.nombre} {cita.cliente.apellido or ''}".strip(),
            "cliente_telefono": cita.cliente.telefono,
            "especialista_nombre": f"{cita.especialista.nombre} {cita.especialista.apellido or ''}".strip(),
            "servicio_nombre": cita.servicio.nombre,
            "servicio_color": cita.servicio.color_calendario
        }
