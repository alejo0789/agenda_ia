from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import Cita, Cliente, Especialista, Servicio, LiztoConfig
from app.config import settings
from .lizto_client import LiztoClient

class LiztoSyncService:
    def sync_cita(self, db: Session, cita_id: int) -> dict:
        # Validar credenciales
        if not settings.lizto_email or not settings.lizto_password:
            raise HTTPException(status_code=500, detail="Credenciales de Lizto no configuradas en el entorno")

        # 1. Cargar cita con sus relaciones
        cita = db.query(Cita).filter(Cita.id == cita_id).first()
        if not cita:
            raise HTTPException(status_code=404, detail="Cita no encontrada")

        if cita.lizto_reservation_id:
            raise HTTPException(status_code=409, detail="La cita ya está publicada en Lizto")

        cliente: Cliente = cita.cliente
        especialista: Especialista = cita.especialista
        servicio: Servicio = cita.servicio

        # Validar mapeos
        if not especialista.lizto_mapping:
            raise HTTPException(status_code=400, detail="El especialista no está mapeado en Lizto")
        if not servicio.lizto_mapping:
            raise HTTPException(status_code=400, detail="El servicio no está mapeado en Lizto")

        lizto_staff_id = especialista.lizto_mapping.lizto_staff_id
        lizto_service_id = servicio.lizto_mapping.lizto_service_id
        lizto_price_id = servicio.lizto_mapping.lizto_price_id
        lizto_price_value = servicio.lizto_mapping.lizto_price_value

        # Cargar configuración global (location_id, user_id)
        config_location = db.query(LiztoConfig).filter(LiztoConfig.key == "location_id").first()
        config_user = db.query(LiztoConfig).filter(LiztoConfig.key == "user_id").first()
        
        location_id = int(config_location.value) if config_location else 8
        user_id = int(config_user.value) if config_user else 189

        # Iniciar cliente
        client = LiztoClient(settings.lizto_email, settings.lizto_password)
        client.user_id = user_id
        
        if not client.login():
            raise HTTPException(status_code=500, detail="Error en autenticación con Lizto")

        # Buscar cliente por cédula o teléfono
        search_query = cliente.documento_identidad or cliente.telefono
        lizto_customer = client.search_customer(search_query) if search_query else None
        
        if lizto_customer:
            lizto_customer_id = lizto_customer.get("id")
        else:
            # Crear cliente
            doc = cliente.documento_identidad or "000000000"
            phone = cliente.telefono or "0000000000"
            email = cliente.email or f"noreply_{cliente.id}@example.com"
            new_customer = client.create_customer(
                first_name=cliente.nombre,
                last_name=cliente.apellido,
                identification=doc,
                phone=phone,
                email=email
            )
            if not new_customer:
                raise HTTPException(status_code=500, detail="No se pudo crear el cliente en Lizto")
            lizto_customer_id = new_customer.get("id")

        if not lizto_customer_id:
             raise HTTPException(status_code=500, detail="No se pudo obtener el ID del cliente en Lizto")

        # Formatear fechas para la cita
        date_str = cita.fecha.strftime("%Y-%m-%d")
        start_time_str = cita.hora_inicio.strftime("%H:%M:%S")
        
        # Calcular duracion HH:MM:SS
        horas = cita.duracion_minutos // 60
        minutos = cita.duracion_minutos % 60
        duration_str = f"{horas:02d}:{minutos:02d}:00"

        # Creed Cita
        try:
            lizto_reservation_id = client.create_appointment(
                customer_id=lizto_customer_id,
                service_id=lizto_service_id,
                price_id=lizto_price_id,
                price_value=float(lizto_price_value),
                staff_id=lizto_staff_id,
                date_str=date_str,
                start_time=start_time_str,
                duration=duration_str
            )

            if not lizto_reservation_id:
                raise HTTPException(status_code=500, detail="No se pudo crear la reserva (respuesta vacía)")

            # Guardar ID en Cita
            cita.lizto_reservation_id = str(lizto_reservation_id)
            db.commit()

            return {
                "success": True,
                "lizto_reservation_id": cita.lizto_reservation_id
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
