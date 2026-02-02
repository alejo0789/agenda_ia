from app.database import SessionLocal
from app.models.user import Usuario, Rol
from app.models.sede import Sede

def check_user_profile(username):
    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.username == username).first()
        if not user:
            print(f"User {username} not found")
            return
        
        print(f"User: {user.username}")
        print(f"Email: {user.email}")
        print(f"Rol ID: {user.rol_id}")
        print(f"Sede ID: {user.sede_id}")
        
        rol = db.query(Rol).filter(Rol.id == user.rol_id).first()
        if rol:
            print(f"Rol Name: {rol.nombre}")
            print(f"Rol Sede ID: {rol.sede_id}")
        
        sede = db.query(Sede).filter(Sede.id == user.sede_id).first()
        if sede:
            print(f"Sede Name: {sede.nombre}")
        
        print("-" * 20)
        print("Users visible to this user in the same Sede:")
        users_in_sede = db.query(Usuario).filter(Usuario.sede_id == user.sede_id).all()
        for u in users_in_sede:
            print(f"- {u.username} (Rol: {u.rol_id})")
            
        print("-" * 20)
        print("Total users in system:")
        total_users = db.query(Usuario).count()
        print(f"Total: {total_users}")

    finally:
        db.close()

if __name__ == "__main__":
    check_user_profile("admin.keyla")
