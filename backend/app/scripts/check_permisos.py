import sys
import os

# Añadir el directorio raíz del proyecto al path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from app.database import SessionLocal
from app.models.auth import Permiso

def check_permisos():
    db = SessionLocal()
    try:
        permisos = db.query(Permiso).count()
        print(f"Total de permisos en la BD: {permisos}")
        if permisos > 0:
            p = db.query(Permiso).limit(5).all()
            for item in p:
                print(f"- {item.codigo}: {item.nombre}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_permisos()
