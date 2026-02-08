# Script para agregar la columna documentacion a la tabla especialistas
import sys
import os

# Añadir el directorio raíz al path para poder importar app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            # Verificar si la columna existe
            # Usando una consulta compatible con PostgreSQL y SQLite
            print("Verificando tabla especialistas...")
            
            # Intentar obtener información de la columna
            # En SQLite/Postgres esta es una forma segura de checkear
            column_exists = False
            try:
                # Intenta hacer un SELECT simple de la columna para ver si falla
                conn.execute(text("SELECT documentacion FROM especialistas LIMIT 1"))
                column_exists = True
            except Exception:
                column_exists = False

            if not column_exists:
                print("Agregando columna 'documentacion' a la tabla especialistas...")
                # SQL compatible
                conn.execute(text("ALTER TABLE especialistas ADD COLUMN documentacion VARCHAR"))
                # Note: conn.commit() is needed for context managers in some SQLAlchemy versions
                # or if autocommit is not set.
                try:
                    conn.commit()
                except:
                    pass
                print("✓ Columna 'documentacion' agregada correctamente")
            else:
                print("✓ La columna 'documentacion' ya existe")
                
        except Exception as e:
            print(f"❌ Error durante la migración: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    migrate()
