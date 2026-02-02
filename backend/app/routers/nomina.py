from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, date, time
from decimal import Decimal

from ..database import get_db
from ..models.caja import Factura, DetalleFactura
from ..models.especialista import Especialista, EspecialistaServicio
from ..models.producto import Producto
from ..models.servicio import Servicio
from ..schemas.nomina import NominaResponse, NominaResumenEspecialista, NominaItem
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/api/nomina",
    tags=["Nomina"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/resumen", response_model=NominaResponse)
def get_nomina_resumen(
    fecha_inicio: date,
    fecha_fin: date,
    sede_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Convert dates to datetime for comparison
    start_dt = datetime.combine(fecha_inicio, time.min)
    end_dt = datetime.combine(fecha_fin, time.max)
    
    # Base query: Get all paid invoice details in range
    query = db.query(DetalleFactura, Factura).join(Factura).filter(
        Factura.fecha >= start_dt,
        Factura.fecha <= end_dt,
        Factura.estado == 'pagada',
        DetalleFactura.especialista_id.isnot(None) # Only items assigned to a specialist
    )
    
    if sede_id:
        query = query.filter(Factura.sede_id == sede_id)
        
    resultados = query.all()
    
    # Process results in memory (simplest for complex logic mixing products/services)
    # Map: especialista_id -> data
    especialistas_data = {}
    
    # Pre-fetch needed data to avoid N+1
    # We need Specialist info, Service Commission info, Product Commission info.
    
    # 1. Get all relevant specialists
    specialist_ids = set(r[0].especialista_id for r in resultados)
    specialists = db.query(Especialista).filter(Especialista.id.in_(specialist_ids)).all()
    specialist_map = {s.id: s for s in specialists}
    
    # 2. Get Service Commission configurations
    # (svc_id, esp_id) -> (tipo, valor)
    svc_com_query = db.query(EspecialistaServicio).filter(EspecialistaServicio.especialista_id.in_(specialist_ids)).all()
    svc_com_map = {(sc.servicio_id, sc.especialista_id): sc for sc in svc_com_query}
    
    # 3. Get Product Commission configurations
    # prod_id -> percentage
    # We iterate results to find which products are involved first
    product_ids = set(r[0].item_id for r in resultados if r[0].tipo == 'producto')
    products = db.query(Producto).filter(Producto.id.in_(product_ids)).all()
    prod_com_map = {p.id: p.comision_venta for p in products}
    
    # Service Map for names if needed
    service_ids = set(r[0].item_id for r in resultados if r[0].tipo == 'servicio')
    services = db.query(Servicio).filter(Servicio.id.in_(service_ids)).all()
    service_map = {s.id: s for s in services}

    for detalle, factura in resultados:
        esp_id = detalle.especialista_id
        if esp_id not in especialistas_data:
            esp = specialist_map.get(esp_id)
            if not esp: continue
            especialistas_data[esp_id] = {
                "especialista_id": esp.id,
                "nombre": esp.nombre,
                "apellido": esp.apellido,
                "total_servicios": Decimal(0),
                "total_productos": Decimal(0),
                "comision_servicios": Decimal(0),
                "comision_productos": Decimal(0),
                "items": []
            }
            
        data = especialistas_data[esp_id]
        item_nombre = "Desconocido"
        comision_porcentaje = Decimal(0)
        comision_valor = Decimal(0)
        
        if detalle.tipo == 'servicio':
            # Calculate Service Commission
            data["total_servicios"] += detalle.subtotal
            
            svc = service_map.get(detalle.item_id)
            item_nombre = svc.nombre if svc else f"Servicio #{detalle.item_id}"
            
            # Look for specific commission config
            config = svc_com_map.get((detalle.item_id, esp_id))
            if config:
                if config.tipo_comision == 'porcentaje':
                    comision_porcentaje = config.valor_comision
                    comision_valor = detalle.subtotal * (config.valor_comision / 100)
                else: # Fijo
                    # Fixed commission is per unit? Usually yes.
                    # Assuming fixed value is per unit performed. 
                    # If quantity is > 1, multiply.
                    comision_porcentaje = Decimal(0) # It's fixed
                    comision_valor = config.valor_comision * detalle.cantidad
            elif svc and svc.valor_comision is not None:
                # FALLBACK: Use Service Default Commission
                if svc.tipo_comision == 'porcentaje':
                    comision_porcentaje = svc.valor_comision
                    comision_valor = detalle.subtotal * (svc.valor_comision / 100)
                else: # Fijo
                    comision_porcentaje = Decimal(0) # It's fixed
                    comision_valor = svc.valor_comision * detalle.cantidad
                
            data["comision_servicios"] += comision_valor
            
        elif detalle.tipo == 'producto':
            # Calculate Product Commission
            data["total_productos"] += detalle.subtotal
            
            prod = prod_com_map.get(detalle.item_id) # This is the percentage
            # We need the product object for name
            # Re-querying or use filtering above? I only stored comision_venta in map.
            # Let's improve the map to store the whole object or name.
            # (Optimizing later if needed, for now let's assume I can get passing name)
            # Actually I can update the prod_com_map logic above.
             
            # Quick fix for name lookup locally in loop is inefficient but ok for now or fix map
            product_obj = next((p for p in products if p.id == detalle.item_id), None)
            item_nombre = product_obj.nombre if product_obj else f"Producto #{detalle.item_id}"
            
            pct = prod_com_map.get(detalle.item_id, Decimal(0))
            if pct:
                comision_porcentaje = pct
                comision_valor = detalle.subtotal * (pct / 100)
            
            data["comision_productos"] += comision_valor

        # Add to items detail
        data["items"].append(NominaItem(
            fecha=factura.fecha,
            factura_numero=factura.numero_factura,
            item_nombre=item_nombre,
            tipo=detalle.tipo,
            cantidad=detalle.cantidad,
            precio_unitario=detalle.precio_unitario,
            subtotal=detalle.subtotal,
            comision_porcentaje=comision_porcentaje,
            comision_valor=comision_valor
        ))

    # Convert dict to list
    resumen_list = []
    for esp_id, d in especialistas_data.items():
        resumen_list.append(NominaResumenEspecialista(
            especialista_id=d["especialista_id"],
            nombre=d["nombre"],
            apellido=d["apellido"],
            total_servicios=d["total_servicios"],
            total_productos=d["total_productos"],
            comision_servicios=d["comision_servicios"],
            comision_productos=d["comision_productos"],
            total_comision=d["comision_servicios"] + d["comision_productos"],
            items=sorted(d["items"], key=lambda x: x.fecha)
        ))
        
    return NominaResponse(
        fecha_inicio=start_dt,
        fecha_fin=end_dt,
        resumen=resumen_list
    )

@router.get("/detalle/{especialista_id}", response_model=NominaResumenEspecialista)
def get_nomina_detalle_especialista(
    especialista_id: int,
    fecha_inicio: date,
    fecha_fin: date,
    db: Session = Depends(get_db)
):
    # Reuse the logic? Or simple query?
    # Logic is complex due to mixing types. Reusing logic by filtering filtered query might be easier
    # but slightly inefficient to fetch all if we only want one.
    # But since we built the function above to fetch all, let's optimize it slightly or just filter the output.
    # Given the complexity, let's just call the logic for one ID.
    
    # We can refactor the logic above into a service function, but for now I'll just adapt the query filter.
    
    start_dt = datetime.combine(fecha_inicio, time.min)
    end_dt = datetime.combine(fecha_fin, time.max)
    
    query = db.query(DetalleFactura, Factura).join(Factura).filter(
        Factura.fecha >= start_dt,
        Factura.fecha <= end_dt,
        Factura.estado == 'pagada',
        DetalleFactura.especialista_id == especialista_id
    )
    
    resultados = query.all()
    
    # ... logic to build object ...
    # This matches the loop logic above exactly but for one ID.
    
    esp: Especialista = db.query(Especialista).filter(Especialista.id == especialista_id).first()
    if not esp:
        raise HTTPException(status_code=404, detail="Especialista no encontrado")
        
    data = {
        "especialista_id": esp.id,
        "nombre": esp.nombre,
        "apellido": esp.apellido,
        "total_servicios": Decimal(0),
        "total_productos": Decimal(0),
        "comision_servicios": Decimal(0),
        "comision_productos": Decimal(0),
        "items": []
    }
    
    # Fetch maps needed (optimized for single user)
    # Services
    svc_com_query = db.query(EspecialistaServicio).filter(EspecialistaServicio.especialista_id == especialista_id).all()
    svc_com_map = {sc.servicio_id: sc for sc in svc_com_query} # Key only by svc_id since esp is fixed
    
    # Items loop PRE-FETCH
    # We need product info for products involved
    product_ids = set(r[0].item_id for r in resultados if r[0].tipo == 'producto')
    products = db.query(Producto).filter(Producto.id.in_(product_ids)).all()
    prod_map = {p.id: p for p in products}
    
    service_ids = set(r[0].item_id for r in resultados if r[0].tipo == 'servicio')
    services = db.query(Servicio).filter(Servicio.id.in_(service_ids)).all()
    service_map = {s.id: s for s in services}

    for detalle, factura in resultados:
        item_nombre = "Desconocido"
        comision_porcentaje = Decimal(0)
        comision_valor = Decimal(0)
        
        if detalle.tipo == 'servicio':
            data["total_servicios"] += detalle.subtotal
            svc = service_map.get(detalle.item_id)
            item_nombre = svc.nombre if svc else f"Servicio #{detalle.item_id}"
            
            config = svc_com_map.get(detalle.item_id)
            if config:
                if config.tipo_comision == 'porcentaje':
                    comision_porcentaje = config.valor_comision
                    comision_valor = detalle.subtotal * (config.valor_comision / 100)
                else:
                    comision_porcentaje = Decimal(0)
                    comision_valor = config.valor_comision * detalle.cantidad
            elif svc and svc.valor_comision is not None:
                # FALLBACK: Use Service Default Commission
                if svc.tipo_comision == 'porcentaje':
                    comision_porcentaje = svc.valor_comision
                    comision_valor = detalle.subtotal * (svc.valor_comision / 100)
                else: # Fijo
                    comision_porcentaje = Decimal(0)
                    comision_valor = svc.valor_comision * detalle.cantidad
            
            data["comision_servicios"] += comision_valor
            
        elif detalle.tipo == 'producto':
            data["total_productos"] += detalle.subtotal
            prod = prod_map.get(detalle.item_id)
            if prod:
                item_nombre = prod.nombre
                if prod.comision_venta:
                    comision_porcentaje = prod.comision_venta
                    comision_valor = detalle.subtotal * (prod.comision_venta / 100)
            
            data["comision_productos"] += comision_valor
            
        data["items"].append(NominaItem(
            fecha=factura.fecha,
            factura_numero=factura.numero_factura,
            item_nombre=item_nombre,
            tipo=detalle.tipo,
            cantidad=detalle.cantidad,
            precio_unitario=detalle.precio_unitario,
            subtotal=detalle.subtotal,
            comision_porcentaje=comision_porcentaje,
            comision_valor=comision_valor
        ))
        
    return NominaResumenEspecialista(
        especialista_id=data["especialista_id"],
        nombre=data["nombre"],
        apellido=data["apellido"],
        total_servicios=data["total_servicios"],
        total_productos=data["total_productos"],
        comision_servicios=data["comision_servicios"],
        comision_productos=data["comision_productos"],
        total_comision=data["comision_servicios"] + data["comision_productos"],
        items=sorted(data["items"], key=lambda x: x.fecha)
    )
