
from app.database import SessionLocal
from app.models.especialista import Especialista, EspecialistaServicio
from app.models.servicio import Servicio
from app.models.producto import Producto
from app.models.caja import Factura, DetalleFactura
from sqlalchemy import desc

def debug_data():
    db = SessionLocal()
    print("--- DEBUGGING NOMINA DATA ---")

    # 1. Check "Alisado Prueba" Service
    print("\n1. Checking Service 'Alisado Prueba'...")
    # Try case insensitive search
    services = db.query(Servicio).all()
    target_svc = None
    for s in services:
        if "alisado" in s.nombre.lower() or "prueba" in s.nombre.lower():
            print(f"Found Service: ID={s.id}, Name='{s.nombre}'")
            if "alisado" in s.nombre.lower():
                target_svc = s

    if target_svc:
        print(f"Checking commissions for Service ID {target_svc.id}...")
        configs = db.query(EspecialistaServicio).filter_by(servicio_id=target_svc.id).all()
        for c in configs:
            esp = db.query(Especialista).get(c.especialista_id)
            print(f"  - Esp: {esp.nombre} {esp.apellido} (ID {esp.id}) -> Tipo: {c.tipo_comision}, Valor: {c.valor_comision}")
    else:
        print("Service 'Alisado Prueba' not found definitively.")

    # 2. Check "Shampoo Alcalino" Product
    print("\n2. Checking Product 'Shampoo Alcalino'...")
    products = db.query(Producto).all()
    target_prod = None
    for p in products:
        if "shampoo" in p.nombre.lower() or "alcalino" in p.nombre.lower():
            print(f"Found Product: ID={p.id}, Name='{p.nombre}', ComisionVenta={p.comision_venta}")
            target_prod = p
            
    # 3. Check Recent Invoices with these items
    print("\n3. Checking Recent Invoice Details...")
    detalles = db.query(DetalleFactura).join(Factura).order_by(desc(Factura.fecha)).limit(20).all()
    
    for d in detalles:
        d_name = "Unknown"
        if d.tipo == 'servicio':
             svc = db.query(Servicio).get(d.item_id)
             d_name = svc.nombre if svc else "Svc Not Found"
        elif d.tipo == 'producto':
             prod = db.query(Producto).get(d.item_id)
             d_name = prod.nombre if prod else "Prod Not Found"
             
        print(f"Factura {d.factura.numero_factura} | Fecha: {d.factura.fecha} | EspID: {d.especialista_id} | Tipo: {d.tipo} | Item: {d_name} (ID {d.item_id}) | Subtotal: {d.subtotal}")

    db.close()

if __name__ == "__main__":
    debug_data()
