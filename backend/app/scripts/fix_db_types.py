import sys
import os

# Añadir el directorio raíz del proyecto al path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from app.database import engine, SessionLocal

def fix_types():
    print("Iniciando cast de tipos en la base de datos...")
    db = SessionLocal()
    try:
        # 1. Cambiar tipo de columna a boolean en la BD
        print("Convertiendo columnas a BOOLEAN en Postgres...")
        db.execute(text("ALTER TABLE metodos_pago ALTER COLUMN activo TYPE BOOLEAN USING (activo::integer::boolean)"))
        db.execute(text("ALTER TABLE metodos_pago ALTER COLUMN requiere_referencia TYPE BOOLEAN USING (requiere_referencia::integer::boolean)"))
        
        # 3. Commit
        db.commit()
        print("Tipos de datos actualizados correctamente en la base de datos.")
        
    except Exception as e:
        db.rollback()
        print(f"Error actualizando tipos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_types()
