import pytest
from datetime import date, datetime
from decimal import Decimal
from app.models.especialista import Especialista, EspecialistaServicio
from app.models.servicio import Servicio
from app.models.producto import Producto
from app.models.caja import Factura, DetalleFactura
from app.routers.nomina import get_nomina_resumen

def test_nomina_calculation(db_session, admin_user):
    # 1. Setup Data
    # Create Specialist
    esp = Especialista(
        nombre="TestNomina", 
        apellido="User", 
        email="test_nomina_auto@example.com",
        documento_identidad="99988877766"
    )
    db_session.add(esp)
    db_session.commit()
    db_session.refresh(esp)

    # Create Service
    svc = Servicio(nombre="Corte Test Auto", precio_base=10000, duracion_minutos=30)
    db_session.add(svc)
    db_session.commit()
    db_session.refresh(svc)
    
    # Configure Commission (10%)
    esp_svc = EspecialistaServicio(
        especialista_id=esp.id, 
        servicio_id=svc.id, 
        tipo_comision='porcentaje', 
        valor_comision=10
    )
    db_session.add(esp_svc)
    
    # Create Product (Commission 5%)
    prod = Producto(nombre="Shampoo Test Auto", precio_venta=20000, codigo="TESTAUTO001", comision_venta=5)
    db_session.add(prod)
    db_session.commit()
    db_session.refresh(prod)

    # 2. Create Paid Invoice
    factura = Factura(
        numero_factura=f"TESTAUTO-{datetime.now().timestamp()}",
        estado='pagada',
        total=30000,
        subtotal=30000,
        usuario_id=admin_user.id,
        fecha=datetime.now(),
        sede_id=admin_user.sede_id
    )
    db_session.add(factura)
    db_session.commit()
    db_session.refresh(factura)
    
    # Add Details
    det1 = DetalleFactura(
        factura_id=factura.id,
        tipo='servicio',
        item_id=svc.id,
        cantidad=1,
        precio_unitario=10000,
        subtotal=10000,
        especialista_id=esp.id
    )
    det2 = DetalleFactura(
        factura_id=factura.id,
        tipo='producto',
        item_id=prod.id,
        cantidad=1,
        precio_unitario=20000,
        subtotal=20000,
        especialista_id=esp.id
    )
    db_session.add_all([det1, det2])
    db_session.commit()

    # 3. Verify Calculation via Router Logic
    res = get_nomina_resumen(
        fecha_inicio=date.today(), 
        fecha_fin=date.today(), 
        db=db_session
    )
    
    data = next((r for r in res.resumen if r.especialista_id == esp.id), None)
    
    assert data is not None
    assert data.total_servicios == Decimal(10000)
    assert data.total_productos == Decimal(20000)
    # 10% of 10000 = 1000
    assert data.comision_servicios == Decimal(1000)
    # 5% of 20000 = 1000
    assert data.comision_productos == Decimal(1000)
    assert data.total_comision == Decimal(2000)
