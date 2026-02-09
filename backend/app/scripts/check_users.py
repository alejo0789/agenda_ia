import sys
import os

# Añadir el directorio raíz del proyecto al path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from app.database import SessionLocal
from app.models.user import Usuario, Rol

def check_users():
    db = SessionLocal()
    try:
        users = db.query(Usuario).all()
        print(f"Total de usuarios: {len(users)}")
        for u in users:
            rol = db.query(Rol).filter(Rol.id == u.rol_id).first()
            print(f"- Usuario: {u.username}, Rol: {rol.nombre if rol else 'N/A'} (ID: {u.rol_id}), Estado: {u.estado}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
