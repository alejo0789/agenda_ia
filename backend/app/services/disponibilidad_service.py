from sqlalchemy.orm import Session
from typing import List
from datetime import date, time, datetime, timedelta
from fastapi import HTTPException, status

from ..models.especialista import Especialista, HorarioEspecialista, BloqueoEspecialista
from ..models.cita import Cita
from ..models.servicio import Servicio
from ..schemas.especialista import SlotDisponible, DisponibilidadResponse, DisponibilidadNombreResponse
from sqlalchemy import or_, and_, func


class DisponibilidadService:
    """Servicio para cálculo de disponibilidad de especialistas"""

    @staticmethod
    def get_disponibilidad_especialista(
        db: Session, 
        especialista_id: int, 
        servicio_id: int,
        fecha_inicio: date, 
        fecha_fin: date,
        intervalo_minutos: int = 15
    ) -> DisponibilidadResponse:
        """
        Obtener slots disponibles de un especialista para un servicio en un rango de fechas
        """
        # Verificar que el especialista existe y está activo
        especialista = db.query(Especialista).filter(
            Especialista.id == especialista_id,
            Especialista.estado == "activo"
        ).first()

        if not especialista:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Especialista no encontrado o inactivo"
            )

        # Obtener horarios del especialista
        horarios = db.query(HorarioEspecialista).filter(
            HorarioEspecialista.especialista_id == especialista_id,
            HorarioEspecialista.activo == True
        ).all()

        # Obtener bloqueos del especialista
        bloqueos = db.query(BloqueoEspecialista).filter(
            BloqueoEspecialista.especialista_id == especialista_id
        ).all()

        # Generar slots disponibles
        slots = DisponibilidadService._generar_slots(
            fecha_inicio, fecha_fin, horarios, bloqueos, intervalo_minutos
        )

        # TODO: Filtrar slots ocupados por citas cuando se implemente el modelo de Citas
        # citas = db.query(Cita).filter(
        #     Cita.especialista_id == especialista_id,
        #     Cita.fecha.between(fecha_inicio, fecha_fin),
        #     Cita.estado.in_(['agendada', 'confirmada'])
        # ).all()

        return DisponibilidadResponse(
            especialista_id=especialista_id,
            slots=slots
        )

    @staticmethod
    def get_disponibilidad_general(
        db: Session,
        servicio_id: int,
        fecha_inicio: date,
        fecha_fin: date,
        intervalo_minutos: int = 15
    ) -> List[DisponibilidadResponse]:
        """
        Obtener disponibilidad de todos los especialistas activos para un servicio
        """
        # Obtener especialistas activos que ofrecen el servicio
        from ..models.especialista import EspecialistaServicio
        
        especialistas = db.query(Especialista).join(
            EspecialistaServicio,
            Especialista.id == EspecialistaServicio.especialista_id
        ).filter(
            Especialista.estado == "activo",
            EspecialistaServicio.servicio_id == servicio_id
        ).all()

        disponibilidades = []
        for especialista in especialistas:
            disponibilidad = DisponibilidadService.get_disponibilidad_especialista(
                db, especialista.id, servicio_id, fecha_inicio, fecha_fin, intervalo_minutos
            )
            disponibilidades.append(disponibilidad)

        return disponibilidades

    @staticmethod
    def consultar_disponibilidad_por_nombre(
        db: Session,
        sede_id: int,
        nombre_especialista: str,
        servicio_id: int,
        fecha: date,
        hora_inicio: time
    ) -> DisponibilidadNombreResponse:
        """
        Consulta si un especialista por nombre está libre, ocupado o bloqueado
        """
        # 1. Buscar especialista
        terma_busqueda = f"%{nombre_especialista}%"
        especialista = db.query(Especialista).filter(
            Especialista.sede_id == sede_id,
            Especialista.estado == "activo",
            or_(
                Especialista.nombre.ilike(terma_busqueda),
                Especialista.apellido.ilike(terma_busqueda),
                func.concat(Especialista.nombre, " ", Especialista.apellido).ilike(terma_busqueda)
            )
        ).first()

        if not especialista:
             raise HTTPException(status_code=404, detail=f"Especialista '{nombre_especialista}' no encontrado")

        # 2. Obtener duración del servicio para calcular hora_fin
        servicio = db.query(Servicio).filter(Servicio.id == servicio_id).first()
        if not servicio:
            raise HTTPException(status_code=400, detail="Servicio no encontrado")
        
        duracion = servicio.duracion_minutos
        dt_inicio = datetime.combine(fecha, hora_inicio)
        dt_fin = dt_inicio + timedelta(minutes=duracion)
        hora_fin = dt_fin.time()

        # 3. Verificar Bloqueos (HARD STOP)
        bloqueos = db.query(BloqueoEspecialista).filter(
            BloqueoEspecialista.especialista_id == especialista.id
        ).all()

        esta_bloqueado = DisponibilidadService._esta_bloqueado(fecha, hora_inicio, hora_fin, bloqueos)
        if esta_bloqueado:
            return DisponibilidadNombreResponse(
                especialista_id=especialista.id,
                nombre_completo=f"{especialista.nombre} {especialista.apellido}",
                estado="bloqueado",
                mensaje=f"El especialista {especialista.nombre} tiene un bloqueo administrativo en ese horario y no puede atender."
            )

        # 4. Verificar Citas Existentes (SOFT STOP/WARNING)
        citas_conflicto = db.query(Cita).filter(
            Cita.especialista_id == especialista.id,
            Cita.fecha == fecha,
            Cita.estado.notin_(['cancelada', 'no_show']),
            or_(
                # La nueva cita empieza durante otra cita
                and_(Cita.hora_inicio <= hora_inicio, Cita.hora_fin > hora_inicio),
                # La nueva cita termina durante otra cita
                and_(Cita.hora_inicio < hora_fin, Cita.hora_fin >= hora_fin),
                # La nueva cita contiene otra cita
                and_(Cita.hora_inicio >= hora_inicio, Cita.hora_fin <= hora_fin)
            )
        ).all()

        if citas_conflicto:
            conflictos = []
            for c in citas_conflicto:
                conflictos.append({
                    "hora": f"{c.hora_inicio.strftime('%H:%M')} - {c.hora_fin.strftime('%H:%M')}",
                    "cliente": f"{c.cliente.nombre} {c.cliente.apellido or ''}".strip(),
                    "servicio": c.servicio.nombre
                })
            
            return DisponibilidadNombreResponse(
                especialista_id=especialista.id,
                nombre_completo=f"{especialista.nombre} {especialista.apellido}",
                estado="ocupado",
                mensaje=f"El especialista {especialista.nombre} ya tiene otras citas en ese horario, pero el sistema permite sobre-agendar si el usuario lo desea.",
                conflictos=conflictos
            )

        return DisponibilidadNombreResponse(
            especialista_id=especialista.id,
            nombre_completo=f"{especialista.nombre} {especialista.apellido}",
            estado="disponible",
            mensaje=f"El especialista {especialista.nombre} está totalmente disponible."
        )


    @staticmethod
    def _generar_slots(
        fecha_inicio: date,
        fecha_fin: date,
        horarios: List[HorarioEspecialista],
        bloqueos: List[BloqueoEspecialista],
        intervalo_minutos: int
    ) -> List[SlotDisponible]:
        """Generar slots de tiempo basados en horarios y bloqueos"""
        slots = []
        current_date = fecha_inicio

        # Crear diccionario de horarios por día de semana
        horarios_por_dia = {}
        for horario in horarios:
            if horario.dia_semana not in horarios_por_dia:
                horarios_por_dia[horario.dia_semana] = []
            horarios_por_dia[horario.dia_semana].append(horario)

        while current_date <= fecha_fin:
            dia_semana = current_date.weekday()
            # Convertir de lunes=0 a domingo=0
            dia_semana = (dia_semana + 1) % 7

            # Verificar si hay horarios para este día
            if dia_semana in horarios_por_dia:
                for horario in horarios_por_dia[dia_semana]:
                    # Generar slots para este horario
                    hora_actual = horario.hora_inicio
                    while hora_actual < horario.hora_fin:
                        # Calcular hora fin del slot
                        hora_fin_slot = DisponibilidadService._sumar_minutos(
                            hora_actual, intervalo_minutos
                        )

                        if hora_fin_slot <= horario.hora_fin:
                            # Verificar si está bloqueado
                            bloqueado = DisponibilidadService._esta_bloqueado(
                                current_date, hora_actual, hora_fin_slot, bloqueos
                            )

                            slots.append(SlotDisponible(
                                fecha=current_date,
                                hora_inicio=hora_actual,
                                hora_fin=hora_fin_slot,
                                disponible=not bloqueado
                            ))

                        hora_actual = hora_fin_slot

            current_date += timedelta(days=1)

        return slots

    @staticmethod
    def _esta_bloqueado(
        fecha: date,
        hora_inicio: time,
        hora_fin: time,
        bloqueos: List[BloqueoEspecialista]
    ) -> bool:
        """Verificar si un slot está bloqueado"""
        for bloqueo in bloqueos:
            # Verificar si la fecha está en el rango del bloqueo
            if bloqueo.fecha_inicio <= fecha <= bloqueo.fecha_fin:
                # Si es recurrente, verificar día de semana
                if bloqueo.es_recurrente:
                    dia_semana = (fecha.weekday() + 1) % 7
                    if bloqueo.dias_semana and dia_semana not in bloqueo.dias_semana:
                        continue

                # Si el bloqueo tiene horas específicas, verificarlas
                if bloqueo.hora_inicio and bloqueo.hora_fin:
                    # Hay solapamiento si no se cumple que uno termina antes que el otro empiece
                    if not (hora_fin <= bloqueo.hora_inicio or bloqueo.hora_fin <= hora_inicio):
                        return True
                else:
                    # Bloqueo de todo el día
                    return True

        return False

    @staticmethod
    def _sumar_minutos(hora: time, minutos: int) -> time:
        """Sumar minutos a una hora"""
        dt = datetime.combine(date.today(), hora)
        dt += timedelta(minutes=minutos)
        return dt.time()
