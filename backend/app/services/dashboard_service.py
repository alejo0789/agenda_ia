from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, datetime
from typing import Optional

from ..models.cita import Cita
from ..models.cliente import Cliente
from ..models.especialista import Especialista
from ..models.servicio import Servicio
from ..models.caja import Factura

class DashboardService:
    @staticmethod
    def get_stats(db: Session, sede_id: Optional[int] = None, is_admin: bool = False) -> dict:
        today = date.today()
        
        # 1. Citas Hoy
        citas_query = db.query(func.count(Cita.id))
        if sede_id:
            citas_query = citas_query.filter(Cita.sede_id == sede_id)
        citas_hoy = citas_query.filter(Cita.fecha == today).scalar() or 0
        
        # 2. Clientes Activos
        clientes_query = db.query(func.count(Cliente.id)).filter(Cliente.estado == "activo")
        if sede_id:
            clientes_query = clientes_query.filter(Cliente.sede_id == sede_id)
        clientes_activos = clientes_query.scalar() or 0
        
        # 3. Especialistas Activos
        especialistas_query = db.query(func.count(Especialista.id)).filter(Especialista.estado == "activo")
        if sede_id:
            especialistas_query = especialistas_query.filter(Especialista.sede_id == sede_id)
        especialistas_activos = especialistas_query.scalar() or 0
        
        # 4. Ingresos del Mes (Solo si es_admin es True)
        ingresos_mes = None
        if is_admin:
            start_of_month = datetime.combine(today.replace(day=1), datetime.min.time())
            
            facturas_query = db.query(func.sum(Factura.total)).filter(
                and_(
                    Factura.fecha >= start_of_month,
                    Factura.estado == "pagada"
                )
            )
            if sede_id:
                facturas_query = facturas_query.filter(Factura.sede_id == sede_id)
            
            ingresos_mes = facturas_query.scalar() or 0
            ingresos_mes = float(ingresos_mes)

        # 5. Próximas Citas (Del mismo día)
        # Estados válidos: agendada, confirmada, cliente_llego
        proximas_citas_query = db.query(Cita).filter(
            Cita.fecha == today,
            Cita.estado.in_(['agendada', 'confirmada', 'cliente_llego']),
        ).order_by(Cita.hora_inicio.asc())

        if sede_id:
            proximas_citas_query = proximas_citas_query.filter(Cita.sede_id == sede_id)
        
        proximas_citas_db = proximas_citas_query.limit(5).all()
        proximas_citas = []
        for c in proximas_citas_db:
            servicio_txt = c.servicio.nombre if c.servicio else "Sin servicio"
            
            # Format time
            hora_str = c.hora_inicio.strftime("%I:%M %p") if c.hora_inicio else "??:??"
            
            proximas_citas.append({
                "id": c.id,
                "hora": hora_str,
                "cliente": f"{c.cliente.nombre} {c.cliente.apellido}",
                "servicio": servicio_txt,
                "especialista": f"{c.especialista.nombre} {c.especialista.apellido}",
                "estado": c.estado
            })
            
        return {
            "citas_hoy": citas_hoy,
            "clientes_activos": clientes_activos,
            "especialistas_activos": especialistas_activos,
            "ingresos_mes": ingresos_mes,
            "proximas_citas": proximas_citas
        }
