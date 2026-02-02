from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import Rol
from app.models.auth import Permiso

def check_roles():
    db = SessionLocal()
    try:
        print("Querying roles...")
        roles = db.query(Rol).all()
        for rol in roles:
            print(f"Rol: {rol.nombre}")
            print(f"Permisos type: {type(rol.permisos)}")
            try:
                print(f"Permisos count: {len(rol.permisos)}")
                for p in rol.permisos:
                    print(f" - {p.codigo}")
            except Exception as e:
                print(f"Error accessing permisos: {e}")
    except Exception as e:
        print(f"General error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_roles()
