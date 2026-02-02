
import sys
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.auth import Permiso, RolPermiso
from app.models.user import Rol

def fix_specialist_permissions_v2():
    db = SessionLocal()
    try:
        # Find 'Especialista' role
        rol = db.query(Rol).filter(Rol.nombre == "Especialista").first()
        if not rol:
            print("Error: Role 'Especialista' not found")
            return

        print(f"Role 'Especialista' ID: {rol.id}")

        # Permissions needed for POS based on specific endpoint requirements
        needed_permissions = [
            "agenda.ver",       # Required for /api/servicios/activos
            "productos.ver",    # Required for /api/productos
        ]
        
        print("\nChecking permissions for 'Especialista':")
        
        # Get all permissions for this role
        rol_permisos = db.query(RolPermiso).filter(RolPermiso.rol_id == rol.id).all()
        permiso_ids = [rp.permiso_id for rp in rol_permisos]
        
        # Get permission objects
        permisos = db.query(Permiso).filter(Permiso.id.in_(permiso_ids)).all()
        existing_codes = [p.codigo for p in permisos]
        
        for code in needed_permissions:
            if code in existing_codes:
                print(f" [OK] {code}")
            else:
                print(f" [MISSING] {code}")
                # Try to find permission in DB to add it
                permiso_db = db.query(Permiso).filter(Permiso.codigo == code).first()
                if permiso_db:
                    print(f"      -> Adding missing permission {code}...")
                    db.add(RolPermiso(rol_id=rol.id, permiso_id=permiso_db.id))
                else:
                     print(f"      -> Permission {code} not in DB. Attempting creation.")
                     new_permiso = Permiso(codigo=code, nombre=f"Acceso {code}", modulo=code.split('.')[0], descripcion="Auto-generated")
                     db.add(new_permiso)
                     db.commit()
                     db.refresh(new_permiso)
                     db.add(RolPermiso(rol_id=rol.id, permiso_id=new_permiso.id))
                     print(f"      -> Created and assigned {code}")

        
        db.commit()
        print("\nPermission verification/update complete.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_specialist_permissions_v2()
