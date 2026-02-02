import sys
import os
from sqlalchemy import text

# Add the parent directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine

def migrate_roles_table():
    print("Iniciando migración de tabla roles para soporte de sedes...")
    
    with engine.connect() as connection:
        # 1. Add sede_id column
        try:
            print("Agregando columna sede_id...")
            connection.execute(text("ALTER TABLE roles ADD COLUMN IF NOT EXISTS sede_id INTEGER REFERENCES sedes(id);"))
            print("Columna sede_id agregada.")
        except Exception as e:
            print(f"Nota (sede_id): {e}")

        # 2. Drop existing unique constraint on nombre
        # We need to find the name of the constraint first. usually it is roles_nombre_key or similar.
        # But we can try generic name or catch error.
        try:
            print("Intentando eliminar constraint unique de nombre...")
            connection.execute(text("ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_nombre_key;"))
            print("Constraint roles_nombre_key eliminado.")
        except Exception as e:
            print(f"Error al eliminar constraint roles_nombre_key: {e}")
            # Try finding it dynamically if needed, but 'roles_nombre_key' is standard Postgres naming
        
        # 3. Add new composite constraint?
        # For now, we rely on application logic to avoid duplicate names in same scope.
        # But we could add a partial index for valid unique global names:
        # CREATE UNIQUE INDEX unique_global_role_name ON roles (nombre) WHERE sede_id IS NULL;
        try:
            print("Creando índice único para roles globales...")
            connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS unique_global_role_name ON roles (nombre) WHERE sede_id IS NULL;"))
            print("Índice unique_global_role_name creado.")
        except Exception as e:
            print(f"Nota (indice global): {e}")

        # 4. Add index for local roles uniqueness
        # CREATE UNIQUE INDEX unique_local_role_name ON roles (nombre, sede_id) WHERE sede_id IS NOT NULL;
        try:
            print("Creando índice único para roles locales...")
            connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS unique_local_role_name ON roles (nombre, sede_id) WHERE sede_id IS NOT NULL;"))
            print("Índice unique_local_role_name creado.")
        except Exception as e:
            print(f"Nota (indice local): {e}")
            
        connection.commit()
        print("Migración completada exitosamente.")

if __name__ == "__main__":
    migrate_roles_table()
