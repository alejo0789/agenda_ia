from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.cita import Cita
from app.models.especialista import Especialista

def fix_citas_sede():
    db = SessionLocal()
    try:
        # Buscar citas sin sede_id
        citas_sin_sede = db.query(Cita).filter(Cita.sede_id == None).all()
        print(f"Encontradas {len(citas_sin_sede)} citas sin sede_id.")
        
        for cita in citas_sin_sede:
            # Intentar obtener la sede del especialista
            if cita.especialista_id:
                esp = db.query(Especialista).filter(Especialista.id == cita.especialista_id).first()
                if esp and esp.sede_id:
                    cita.sede_id = esp.sede_id
                    print(f"Cita {cita.id} asignada a sede {esp.sede_id} (via especialista)")
                else:
                    # Si no tiene especialista con sede, asignar sede 1 por defecto (o la primera que encuentre)
                    cita.sede_id = 1
                    print(f"Cita {cita.id} asignada a sede 1 por defecto")
        
        db.commit()
        print("Corrección completada.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_citas_sede()
