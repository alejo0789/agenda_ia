
import os
import sys
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.user import Rol
from app.models.auth import Permiso

def dump_specialist_perms():
    db = SessionLocal()
    try:
        for role_name in ["Especialista", "Cajero", "Administrador", "Recepcionista"]:
            rol = db.query(Rol).filter(Rol.nombre == role_name).first()
            if not rol:
                print(f"No se encontró el rol '{role_name}' en la DB local.\n")
                continue
            
            print(f"Rol: {rol.nombre}")
            print("Permisos asignados:")
            for p in rol.permisos:
                print(f"  - '{p.codigo}'")
            print("-" * 20)
            
    finally:
        db.close()

if __name__ == "__main__":
    dump_specialist_perms()
