import sys
import os

# Añadir el directorio raíz del proyecto al path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from app.database import SessionLocal
from app.models.caja import MetodoPago

def check_metodos():
    db = SessionLocal()
    try:
        metodos = db.query(MetodoPago).all()
        print(f"Total de métodos encontrados: {len(metodos)}")
        for m in metodos:
            print(f"- ID: {m.id}, Nombre: {m.nombre}, Activo: {m.activo}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_metodos()
