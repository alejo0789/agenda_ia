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
        admin_role = db.query(Rol).filter(Rol.nombre == 'Administrador').first()
        if not admin_role:
            print("No se encontró el rol Administrador")
            return
        
        perms_count = db.query(RolPermiso).filter(RolPermiso.rol_id == admin_role.id).count()
        print(f"El rol Administrador (ID: {admin_role.id}) tiene {perms_count} permisos.")
        
        if perms_count == 0:
            print("¡AVISO! El Administrador no tiene permisos asignados.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_role_perms()
