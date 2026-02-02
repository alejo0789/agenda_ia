from app.database import SessionLocal
from app.models.user import Rol

def list_roles():
    db = SessionLocal()
    try:
        roles = db.query(Rol).all()
        print(f"{'ID':<5} | {'Nombre':<20} | {'Sede ID':<10} | {'Es Sistema':<10}")
        print("-" * 55)
        for r in roles:
            print(f"{r.id:<5} | {r.nombre:<20} | {str(r.sede_id):<10} | {str(r.es_sistema):<10}")
    finally:
        db.close()

if __name__ == "__main__":
    list_roles()
