import sys
import os

# Añadir el directorio raíz del proyecto al path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from app.database import SessionLocal
from app.models.caja import MetodoPago

def simulate_listing():
    db = SessionLocal()
    try:
        # Mimic the router query
        solo_activos = True
        query = db.query(MetodoPago)
        if solo_activos:
            query = query.filter(MetodoPago.activo == True)
        metodos = query.order_by(MetodoPago.nombre).all()
        print(f"Métodos activos encontrados: {len(metodos)}")
        for m in metodos:
            print(f"- {m.nombre}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    simulate_listing()
