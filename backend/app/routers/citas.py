from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ..database import get_db
from ..schemas.cita import (
    CitaCreate, CitaUpdate, CitaResponse, CitaListResponse, CitaCambiarEstado,
    CitaAgenteRequest, NotificacionRequest
)
from ..schemas.cliente import ClienteCreate
from ..models.cliente import Cliente
from ..models.sede import Sede
from ..models.servicio import Servicio
from ..models.especialista import Especialista, EspecialistaServicio
from ..services.cita_service import CitaService
from ..services.cliente_service import ClienteService
from ..dependencies import require_permission
from ..config import settings
import httpx
import json

router = APIRouter(
    prefix="/api/citas",
    tags=["Citas"]
)


# ============================================
# ENDPOINTS CRUD
# ============================================

@router.get("", response_model=List[CitaListResponse])
def listar_citas(
    fecha_inicio: date = Query(..., description="Fecha inicio"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin (opcional)"),
    especialista_id: Optional[int] = Query(None, description="Filtrar por especialista"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("agenda.ver"))
):
    """
    Listar citas por rango de fechas
    Permiso: agenda.ver
    """
    citas = CitaService.get_by_fecha(
        db=db,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        especialista_id=especialista_id,
        estado=estado,
        sede_id=auth_context["user"].sede_id
    )
    return [CitaService.format_cita_list(c) for c in citas]


@router.get("/{cita_id}", response_model=CitaResponse)
def obtener_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.ver"))
):
    """
    Obtener una cita por ID
    Permiso: agenda.ver
    """
    cita = CitaService.get_by_id(db, cita_id)
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    
    # Cargar relaciones
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
        "notas_internas": cita.notas_internas,
        "precio": cita.precio,
        "lizto_reservation_id": getattr(cita, "lizto_reservation_id", None),
        "fecha_creacion": cita.fecha_creacion,
        "fecha_actualizacion": cita.fecha_actualizacion,
        "cliente": {
            "id": cita.cliente.id,
            "nombre": cita.cliente.nombre,
            "apellido": cita.cliente.apellido,
            "telefono": cita.cliente.telefono
        } if cita.cliente else None,
        "especialista": {
            "id": cita.especialista.id,
            "nombre": cita.especialista.nombre,
            "apellido": cita.especialista.apellido,
            "color": None  # El modelo no tiene color, se asigna desde frontend
        } if cita.especialista else None,
        "servicio": {
            "id": cita.servicio.id,
            "nombre": cita.servicio.nombre,
            "duracion_minutos": cita.servicio.duracion_minutos,
            "precio_base": cita.servicio.precio_base,
            "color_calendario": cita.servicio.color_calendario
        } if cita.servicio else None
    }


@router.post("", response_model=CitaResponse, status_code=status.HTTP_201_CREATED)
def crear_cita(
    cita_data: CitaCreate,
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("agenda.crear"))
):
    """
    Crear una nueva cita
    Permiso: agenda.crear
    """
    try:
        current_user = auth_context["user"]
        cita = CitaService.crear(db, cita_data, current_user.id, current_user.sede_id)
        return obtener_cita(cita.id, db, auth_context)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{cita_id}", response_model=CitaResponse)
def actualizar_cita(
    cita_id: int,
    cita_data: CitaUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.editar"))
):
    """
    Actualizar una cita existente
    Permiso: agenda.editar
    """
    cita = CitaService.actualizar(db, cita_id, cita_data)
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    return obtener_cita(cita_id, db, _)


@router.patch("/{cita_id}/estado", response_model=CitaResponse)
def cambiar_estado_cita(
    cita_id: int,
    estado_data: CitaCambiarEstado,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.editar"))
):
    """
    Cambiar el estado de una cita
    Permiso: agenda.editar
    """
    cita = CitaService.cambiar_estado(db, cita_id, estado_data.estado, estado_data.notas_internas)
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    return obtener_cita(cita_id, db, _)


@router.delete("/{cita_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.eliminar"))
):
    """
    Eliminar una cita (solo si no está completada)
    Permiso: agenda.eliminar
    """
    try:
        if not CitaService.eliminar(db, cita_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cita no encontrada"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )



# ============================================
# ENDPOINTS ADICIONALES
# ============================================

@router.post("/agendar-externo", response_model=CitaResponse, status_code=status.HTTP_201_CREATED)
def agendar_cita_externo(
    request: CitaAgenteRequest,
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("agenda.crear"))
):
    """
    Crear cita desde agente externo (n8n/whatsapp)
    - Busca o crea cliente por cédula
    - Busca servicio y sede por nombre
    - Asigna especialista por defecto si es necesario
    - Registra abono si aplica
    """
    # 1. Validar Sede (Prioridad: Sede enviada por el agente)
    nombre_sede = request.sede
    sede = db.query(Sede).filter(Sede.nombre.ilike(f"%{nombre_sede}%"), Sede.estado == 'activa').first()
    if not sede:
        # Si no la encuentra por nombre, intentamos buscar una marcada como principal
        sede = db.query(Sede).filter(Sede.es_principal == True).first()
        if not sede:
            raise HTTPException(status_code=400, detail=f"Sede '{nombre_sede}' no encontrada")

    # 2. Validar o buscar Servicio (alisado, repolarizacion, garantia)
    nombre_servicio = request.servicio
    servicio = db.query(Servicio).filter(Servicio.nombre.ilike(f"%{nombre_servicio}%"), Servicio.sede_id == sede.id).first()
    
    if not servicio:
        raise HTTPException(status_code=400, detail=f"Servicio '{nombre_servicio}' no encontrado en la sede {sede.nombre}")

    # 3. Buscar o Crear Cliente
    if not request.nombre or not request.cedula or not request.telefono:
        raise HTTPException(status_code=400, detail="Nombre, Cédula y Teléfono del cliente son obligatorios")

    cliente_existente = db.query(Cliente).filter(
        or_(
            Cliente.cedula == request.cedula,
            Cliente.telefono == request.telefono
        )
    ).first()
    
    if not cliente_existente:
        nuevo_cliente_data = ClienteCreate(
            nombre=request.nombre,
            apellido=request.apellido,
            cedula=request.cedula,
            telefono=request.telefono,
            email=request.email
        )
        cliente_existente = ClienteService.create(db, nuevo_cliente_data, sede.id)
    
    # 4. Asignar Especialista
    especialista_id = request.especialista_id
    if not especialista_id:
        # Buscar el primer especialista activo en esa sede
        especialista = db.query(Especialista).filter(Especialista.sede_id == sede.id, Especialista.estado == 'activo').first()
        if not especialista:
            raise HTTPException(status_code=400, detail="No hay especialistas disponibles en esta sede")
        especialista_id = especialista.id

    # 4.5 Resolver Método de Pago por Nombre (Si aplica)
    metodo_pago_id = request.metodo_pago_id
    if request.metodo_pago and not metodo_pago_id:
        # Buscar el método de pago más parecido por nombre
        mp = db.query(MetodoPago).filter(
            MetodoPago.nombre.ilike(f"%{request.metodo_pago}%"),
            MetodoPago.activo == True
        ).first()
        if mp:
            metodo_pago_id = mp.id

    # 5. Crear Cita
    try:
        cita_create = CitaCreate(
            cliente_id=cliente_existente.id,
            especialista_id=especialista_id,
            servicio_id=servicio.id,
            fecha=request.fecha,
            hora_inicio=request.hora_inicio,
            notas=request.notas,
            # Abono
            monto_abono=request.monto_abono,
            metodo_pago_id=request.metodo_pago_id,
            referencia_pago=request.referencia_abono,
            concepto_abono=request.concepto_abono
        )
    
        current_user = auth_context["user"]
        # Usamos la sede detectada por el bot en lugar de la del usuario que ejecuta si es diferente
        cita = CitaService.crear(db, cita_create, current_user.id, sede.id)
        
        # Devolver respuesta completa
        return obtener_cita(cita.id, db, auth_context)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )



@router.get("/cliente/{cliente_id}", response_model=List[CitaListResponse])
def listar_citas_cliente(
    cliente_id: int,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.ver"))
):
    """
    Listar citas de un cliente
    Permiso: agenda.ver
    """
    citas = CitaService.get_by_cliente(db, cliente_id, limit)
    return [CitaService.format_cita_list(c) for c in citas]


@router.get("/especialista/{especialista_id}/fecha/{fecha}", response_model=List[CitaListResponse])
def listar_citas_especialista(
    especialista_id: int,
    fecha: date,
    db: Session = Depends(get_db),
    _: dict = Depends(require_permission("agenda.ver"))
):
    """
    Listar citas de un especialista en una fecha
    Permiso: agenda.ver
    """
    citas = CitaService.get_by_especialista(db, especialista_id, fecha)
    return [CitaService.format_cita_list(c) for c in citas]



def _enviar_whatsapp_mensaje(phone: str, name: str, message: str, media_url: str = None):
    """
    Función helper interna para enviar mensajes de WhatsApp siguiendo el formato n8n requerido.
    Si hay media_url, envía primero el texto y luego la imagen como mensajes separados.
    """
    # Normalización básica de teléfono para Colombia
    clean_phone = "".join(filter(str.isdigit, phone))
    if len(clean_phone) == 10:
        clean_phone = f"57{clean_phone}"
    
    url = "https://largebotinterfaz-production-5b38.up.railway.app/webhook/receive-message"
    
    headers = {
        "Content-Type": "application/json",
        "x-tenant-Slug": "cali"
    }
    
    import time
    import random
    from datetime import datetime
    
    def get_payload(msg, media=None):
        timestamp_ms = int(time.time() * 1000)
        random_id = random.randint(0, 999)
        
        # Asegurar que el media_url sea una URL absoluta si existe
        full_media_url = media
        if media and media.startswith('/'):
            # Importar quote para manejar espacios y caracteres especiales
            from urllib.parse import quote
            
            # Limpiar barras para evitar //
            base = settings.base_url.rstrip('/')
            # Codificar el path (banners/nombre.jpg)
            encoded_media = quote(media)
            full_media_url = f"{base}{encoded_media}"
            
        return {
            "phone": clean_phone,
            "contact_name": name,
            "message": msg,
            "media_url": full_media_url,
            "media_type": "image" if media else "text",
            "sender_type": "bot",
            "timestamp": datetime.now().isoformat(),
            "whatsapp_id": f"bot_{timestamp_ms}_{random_id}",
            "tag": "agenda"
        }

    # Si hay imagen, enviamos dos mensajes
    if media_url:
        # 1. Enviar el Texto
        payload_text = get_payload(message)
        httpx.post(url, headers=headers, json=payload_text, timeout=10)
        
        # Pequeña pausa para asegurar el orden
        time.sleep(1)
        
        # 2. Enviar la Imagen (con caption opcional o vacío)
        payload_image = get_payload("", media_url)
        response = httpx.post(url, headers=headers, json=payload_image, timeout=10)
        response.raise_for_status()
    else:
        # Enviar solo Texto
        payload = get_payload(message)
        response = httpx.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        
    return {"status": "success", "message": "Notificación enviada correctamente"}


@router.post("/notificar", status_code=status.HTTP_200_OK)
def enviar_notificacion(
    request: NotificacionRequest,
    _: dict = Depends(require_permission("agenda.crear"))
):
    """
    Enviar notificacion de WhatsApp mediante el servicio externo bot
    Permiso: agenda.crear
    """
    try:
        return _enviar_whatsapp_mensaje(request.phone, request.name, request.message)
    except httpx.HTTPError as e:
        print(f"Error enviando notificación: {e}")
        # Intentar leer el response
        detail = "Error enviando el mensaje"
        if hasattr(e, 'response') and e.response is not None:
             try:
                 error_json = e.response.json()
                 detail = error_json.get("error", detail)
             except Exception:
                 detail = e.response.text or detail

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )


@router.post("/notificar-especialistas", status_code=status.HTTP_200_OK)
def notificar_agenda_especialistas(
    fecha: date = Query(..., description="Fecha de la agenda"),
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("agenda.crear"))
):
    """
    Enviar agenda del día a todos los especialistas que tengan citas
    """
    sede_id = auth_context["user"].sede_id
    citas = CitaService.get_by_fecha(db, fecha, sede_id=sede_id)
    
    # Filtrar solo las que no están canceladas
    citas = [c for c in citas if c.estado not in ['cancelada', 'no_show']]
    
    if not citas:
        return {"status": "success", "message": "No hay citas para notificar"}

    # Agrupar por especialista
    agenda_por_especialista = {}
    for cita in citas:
        if not cita.especialista_id:
            continue
        if cita.especialista_id not in agenda_por_especialista:
            agenda_por_especialista[cita.especialista_id] = {
                "especialista": cita.especialista,
                "servicios": []
            }
        agenda_por_especialista[cita.especialista_id]["servicios"].append(cita)

    # Enviar notificaciones
    enviados = 0
    errores = 0
    
    for esp_id, data in agenda_por_especialista.items():
        esp = data["especialista"]
        if not esp.telefono:
            continue
            
        servicios_text = ""
        for cita in sorted(data["servicios"], key=lambda x: x.hora_inicio):
            hora = cita.hora_inicio.strftime("%H:%M")
            servicios_text += f"\n* {hora} - {cita.servicio.nombre if cita.servicio else 'Servicio'}"
            
        mensaje = f"Hola {esp.nombre}, para mañana tenemos los servicios:{servicios_text}\n\n¿Puedes hacerlos? si/no"
        
        # Usar la lógica de envío
        try:
            _enviar_whatsapp_mensaje(esp.telefono, esp.nombre, mensaje)
            enviados += 1
        except Exception as e:
            print(f"Error al enviar a {esp.nombre}: {e}")
            errores += 1
            
    return {
        "status": "success", 
        "message": f"Agenda enviada a {enviados} especialistas. Errores: {errores}"
    }


@router.post("/notificar-clientes", status_code=status.HTTP_200_OK)
def notificar_confirmacion_clientes(
    fecha: date = Query(..., description="Fecha de las citas"),
    media_url: Optional[str] = Query(None, description="URL de la imagen opcional"),
    db: Session = Depends(get_db),
    auth_context: dict = Depends(require_permission("agenda.crear"))
):
    """
    Enviar confirmación de cita a todos los clientes del día
    """
    sede_id = auth_context["user"].sede_id
    citas = CitaService.get_by_fecha(db, fecha, sede_id=sede_id)
    
    # Filtrar solo las agendadas
    citas = [c for c in citas if c.estado == 'agendada']
    
    if not citas:
        return {"status": "success", "message": "No hay citas pendientes por confirmar"}

    enviados = 0
    errores = 0
    
    for cita in citas:
        cliente = cita.cliente
        if not cliente or not cliente.telefono:
            continue
            
        hora = cita.hora_inicio.strftime("%I:%M %p")
        servicio = cita.servicio.nombre if cita.servicio else "tu servicio"
        
        mensaje = (
            f"💖 ¡Hola hermosa {cliente.nombre}!\n\n"
            f"En el Club de Alisados Large estamos felices de poder recibirte mañana a las {hora}✨\n\n"
            "Datos importantes: \n\n"
            "1️⃣ Si necesitas cambiar tu cita, por favor avísanos mínimo con 3 horas de anticipación "
            "(esto no aplica para las citas de las 7:00 a.m.) y Podrás reasignar tu cita hasta 2 veces como máximo.\n\n"
            "2️⃣ Tendrás 15 minutos de espera; pasado ese tiempo, la cita se liberará automáticamente.\n\n"
            "3️⃣ En caso de no asistir o no avisar dentro del tiempo establecido, el abono no podrá ser reembolsado.\n\n"
            "4️⃣ Te recordamos que si bien los lavados no están incluidos dentro de la promoción son un factor importante "
            "para que veas finalizado tu procedimiento y el alisado de tu cabello final.\n\n"
            "5️⃣ Finalmente la duración del tratamiento depende del postcuidado, por eso tenemos una promoción "
            "del kit post cuidado en 135.000, que incluye shampoo, acondicionador, mascarilla y termoprotector, "
            "recuerda que todos nuestros productos son completamente orgánicos y que han dado unos resultados espectaculares.\n\n"
            "¡Te esperamos! 💓 🌸\n\n"
            "Equipo Large Cali\n"
            "📍 Av. 6A Norte #37BN-132, frente a Chipichape (2° piso, arriba de Drogas La Rebaja)\n"
            "📍 https://maps.google.com/maps/search/Large%20Cali/@3.4511,-76.5308,17z?hl=es"
        )
        
        try:
            _enviar_whatsapp_mensaje(cliente.telefono, cliente.nombre, mensaje, media_url)
            enviados += 1
        except Exception as e:
            print(f"Error al enviar a cliente {cliente.nombre}: {e}")
            errores += 1
            
    return {
        "status": "success", 
        "message": f"Confirmación enviada a {enviados} clientes. Errores: {errores}"
    }
