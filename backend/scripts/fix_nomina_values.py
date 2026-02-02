
from app.database import SessionLocal
from app.models.especialista import EspecialistaServicio
from app.models.producto import Producto
from decimal import Decimal

def fix_data():
    db = SessionLocal()
    
    # 1. Update Product Commission
    print("Updating Product Commission...")
    prod = db.query(Producto).get(1)
    if prod:
        print(f"Product {prod.nombre} (ID {prod.id}): Old Comision={prod.comision_venta}")
        prod.comision_venta = 10
        print(f"Product {prod.nombre} (ID {prod.id}): New Comision={prod.comision_venta}")
    else:
        print("Product ID 1 not found")
        
    # 2. Update/Create Service Commission for Specialist ID 4
    print("\nUpdating Service Commission for ID 4...")
    esp_id = 4
    svc_id = 2
    
    config = db.query(EspecialistaServicio).filter_by(especialista_id=esp_id, servicio_id=svc_id).first()
    if config:
        print(f"Updating existing config: {config.tipo_comision} {config.valor_comision}")
        config.tipo_comision = 'fijo'
        config.valor_comision = 30000
    else:
        print("Creating new config...")
        config = EspecialistaServicio(
            especialista_id=esp_id,
            servicio_id=svc_id,
            tipo_comision='fijo',
            valor_comision=30000
        )
        db.add(config)
        
    print(f"Service Config Set: Specialist {esp_id}, Service {svc_id} -> Fijo $30000")
    
    db.commit()
    db.close()
    print("\nDone.")

if __name__ == "__main__":
    fix_data()
