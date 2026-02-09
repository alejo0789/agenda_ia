import sys
import os

# Añadir el directorio raíz del proyecto al path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from app.database import SessionLocal
from app.models.user import Rol
from app.models.auth import Permiso, RolPermiso

def check_role_perms():
    db = SessionLocal()
    try:
        super_admin_role = db.query(Rol).filter(Rol.id == 1).first()
        if not super_admin_role:
            print("No se encontró el rol ID 1")
            return
        
        perms_count = db.query(RolPermiso).filter(RolPermiso.rol_id == 1).count()
        print(f"El rol {super_admin_role.nombre} (ID: 1) tiene {perms_count} permisos.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_role_perms()
