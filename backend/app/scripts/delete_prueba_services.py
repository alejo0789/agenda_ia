import sys
import os

# Añadir el directorio raíz del proyecto al path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from app.database import SessionLocal
from app.models.servicio import Servicio

def delete_prueba_services():
    db = SessionLocal()
    try:
        # Buscar servicios que contengan "prueba" en el nombre (case insensitive)
        servicios_prueba = db.query(Servicio).filter(Servicio.nombre.ilike('%prueba%')).all()
        
        if not servicios_prueba:
            print("No se encontraron servicios con el nombre 'prueba'.")
            return

        print(f"Se encontraron {len(servicios_prueba)} servicios para eliminar:")
        for s in servicios_prueba:
            print(f"- ID: {s.id}, Nombre: {s.nombre}")
            db.delete(s)
        
        db.commit()
        print("Servicios eliminados correctamente.")
        
    except Exception as e:
        db.rollback()
        print(f"Error al eliminar servicios: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    delete_prueba_services()
