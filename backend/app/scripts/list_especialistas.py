import sys
import os
from dotenv import load_dotenv

# Añadir el directorio raíz al path para poder importar la app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Cargar .env explícitamente
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
env_path = os.path.join(backend_root, '.env')
load_dotenv(env_path)

from app.database import SessionLocal
from app.models.especialista import Especialista

def list_specialists():
    db = SessionLocal()
    try:
        especialistas = db.query(Especialista).all()
        print(f"Total especialistas: {len(especialistas)}")
        for e in especialistas:
            print(f"ID: {e.id}, Nombre: {e.nombre} {e.apellido}, Email: {e.email}, Estado: {e.estado}")
    finally:
        db.close()

if __name__ == "__main__":
    list_specialists()
