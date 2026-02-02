from app.database import SessionLocal
from app.models.user import Usuario, Rol
from app.models.especialista import Especialista
from app.models.sede import Sede
from app.services.password_service import PasswordService

def sync_specialists():
    db = SessionLocal()
    try:
        roles = db.query(Rol).filter(Rol.nombre.ilike('%especialista%')).all()
        if not roles:
            print("No specialist role found.")
            return
        
        rol_id = roles[0].id
        
        sede = db.query(Sede).first()
        sede_id = sede.id if sede else None

        esps = db.query(Especialista).all()
        print(f"Found {len(esps)} specialists.")

        count_created = 0
        count_linked = 0

        for e in esps:
            # Check if linked user exists (by especialista_id)
            user_linked = db.query(Usuario).filter(Usuario.especialista_id == e.id).first()
            
            if user_linked:
                print(f"Specialist {e.nombre} already linked to user {user_linked.username}.")
                continue
            
            if not e.email:
                print(f"Specialist {e.nombre} has no email. Skipping.")
                continue

            # Check if user with email exists
            user_by_email = db.query(Usuario).filter(Usuario.email == e.email).first()

            if user_by_email:
                print(f"Linking existing user {user_by_email.username} to specialist {e.nombre}...")
                user_by_email.especialista_id = e.id
                db.commit()
                count_linked += 1
            else:
                print(f"Creating user for specialist {e.nombre} ({e.email})...")
                base_username = e.email.split("@")[0]
                username = base_username
                counter = 1
                while db.query(Usuario).filter(Usuario.username == username).first():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                new_user = Usuario(
                    nombre=f"{e.nombre} {e.apellido}",
                    username=username,
                    email=e.email,
                    password_hash=PasswordService.hash_password('Especialista123!'),
                    rol_id=rol_id,
                    especialista_id=e.id,
                    estado='activo',
                    primer_acceso=True,
                    requiere_cambio_password=True,
                    sede_id=sede_id
                )
                db.add(new_user)
                db.commit()
                count_created += 1
        
        print(f"Sync complete. Created: {count_created}, Linked: {count_linked}")

    except Exception as ex:
        print(f"Error: {ex}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    sync_specialists()
