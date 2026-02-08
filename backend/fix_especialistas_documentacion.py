# Script para agregar la columna documentacion a la tabla especialistas
import sys
import os

# Añadir el directorio raíz al path para poder importar app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Verificando tabla especialistas...")
        
        # Check if column exists in a way that doesn't break the transaction for Postgres
        # We can check information_schema for Postgres/MySQL or pragma for SQLite
        
        column_exists = False
        try:
            # Consistent way to check if column exists without throwing an exception that breaks transactions
            # Information schema is standard for Postgres
            if "postgresql" in str(engine.url):
                check_sql = """
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'especialistas' 
                    AND column_name = 'documentacion'
                """
                query = conn.execute(text(check_sql))
                column_exists = query.fetchone() is not None
            else:
                # Fallback for SQLite (local Dev)
                query = conn.execute(text("PRAGMA table_info(especialistas)"))
                rows = query.fetchall()
                column_exists = any(row[1] == 'documentacion' for row in rows)
        except Exception as e:
            print(f"Error al verificar columna: {e}")
            # If check fails for some reason, we'll try to add it anyway inside a safe block

        if not column_exists:
            print("Agregando columna 'documentacion' a la tabla especialistas...")
            try:
                # Start a fresh transaction if possible or just execute
                conn.execute(text("ALTER TABLE especialistas ADD COLUMN documentacion VARCHAR"))
                # Using explicit commit for engines that require it
                try:
                    conn.commit()
                except:
                    pass
                print("Column 'documentacion' added successfully")
            except Exception as e:
                # If it fails here, maybe it already existed or there's a real issue
                if "already exists" in str(e).lower():
                    print("Column already exists (verified via exception)")
                else:
                    print(f"Error adding column: {e}")
        else:
            print("Column 'documentacion' already exists")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Fatal error: {e}")
