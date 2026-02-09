import sys
import os
from dotenv import load_dotenv

# Añadir el directorio raíz al path para poder importar la app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Cargar .env explícitamente desde la raíz del backend
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
env_path = os.path.join(backend_root, '.env')
load_dotenv(env_path)

from app.database import SessionLocal
from app.models.especialista import Especialista, HorarioEspecialista, EspecialistaServicio
from app.models.user import Usuario

def delete_specialist(db, especialista):
    try:
        print(f"[OK] Borrando especialista: {especialista.nombre} {especialista.apellido} (ID: {especialista.id}, Email: {especialista.email})")

        # 0. Borrar Citas (¡Cuidado! Solo para especialistas de prueba)
        from app.models.cita import Cita
        citas_deleted = db.query(Cita).filter(Cita.especialista_id == especialista.id).delete()
        print(f"   - Borradas {citas_deleted} citas")

        # 1. Borrar horarios
        horarios_deleted = db.query(HorarioEspecialista).filter(HorarioEspecialista.especialista_id == especialista.id).delete()
        print(f"   - Borrados {horarios_deleted} horarios")

        # 2. Borrar asignaciones de servicios
        servicios_deleted = db.query(EspecialistaServicio).filter(EspecialistaServicio.especialista_id == especialista.id).delete()
        print(f"   - Borradas {servicios_deleted} asignaciones de servicios")

        # 3. Buscar y borrar usuario asociado
        usuario = db.query(Usuario).filter(Usuario.especialista_id == especialista.id).first()
        if usuario:
            from app.models.auth import Sesion
            sesiones_deleted = db.query(Sesion).filter(Sesion.usuario_id == usuario.id).delete()
            print(f"   - Borradas {sesiones_deleted} sesiones del usuario")
            
            db.delete(usuario)
            print(f"   - Borrado usuario: {usuario.username}")

        # 4. Borrar el especialista
        db.delete(especialista)
        print(f"[OK] Especialista borrado definitivamente.\n")
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"  [ERROR] {e}")

def main():
    db = SessionLocal()
    try:
        # Intentos por email o nombre
        emails_a_borrar = ["aalejo09@gmail.com", "alejoprueba@gmail.com", "prueba@gmail.com", "alejo078009@hotmail.com"]
        
        for email in emails_a_borrar:
            esp = db.query(Especialista).filter(Especialista.email == email).first()
            if esp:
                delete_specialist(db, esp)

        # Buscar por nombre si quedan "prueba"
        especialistas_prueba = db.query(Especialista).filter(Especialista.nombre.ilike("%prueba%")).all()
        for esp in especialistas_prueba:
            delete_specialist(db, esp)

    finally:
        db.close()

if __name__ == "__main__":
    main()
