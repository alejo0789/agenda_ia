from app.database import SessionLocal
from app.models.user import Usuario

def list_users():
    db = SessionLocal()
    try:
        users = db.query(Usuario).all()
        print(f"{'ID':<5} | {'Username':<15} | {'Rol':<5} | {'Sede':<5} | {'Email':<25}")
        print("-" * 65)
        for u in users:
            print(f"{u.id:<5} | {u.username:<15} | {u.rol_id:<5} | {str(u.sede_id):<5} | {u.email:<25}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
