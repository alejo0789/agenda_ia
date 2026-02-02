
import sys
import os

# Add parent dir to path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from sqlalchemy import text

def run_migration():
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            print("Creating 'sedes' table if not exists...")
            # create_all will create sedes table if not exists
            Base.metadata.create_all(bind=engine)
            
            print("Checking and adding columns to 'usuarios'...")
            # Check if column sede_id exists in usuarios (simplified check, usually try-except)
            try:
                connection.execute(text("ALTER TABLE usuarios ADD COLUMN sede_id INTEGER REFERENCES sedes(id)"))
                print("Added column 'sede_id' to 'usuarios'")
            except Exception as e:
                print(f"Column 'sede_id' might already exist in 'usuarios': {e}")
                
            try:
                connection.execute(text("ALTER TABLE usuarios ADD COLUMN primer_acceso BOOLEAN DEFAULT TRUE"))
                print("Added column 'primer_acceso' to 'usuarios'")
            except Exception as e:
                print(f"Column 'primer_acceso' might already exist: {e}")

            try:
                connection.execute(text("ALTER TABLE usuarios ADD COLUMN requiere_cambio_password BOOLEAN DEFAULT FALSE"))
                print("Added column 'requiere_cambio_password' to 'usuarios'")
            except Exception as e:
                print(f"Column 'requiere_cambio_password' might already exist: {e}")
                
            # Update other tables as per requirements if they exist
            tables_to_update = ['especialistas', 'clientes', 'citas', 'facturas', 'cajas']
            for table in tables_to_update:
                try:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN sede_id INTEGER REFERENCES sedes(id)"))
                    print(f"Added column 'sede_id' to '{table}'")
                except Exception as e:
                    print(f"Could not add 'sede_id' to '{table}' (might exist or table missing): {e}")

            trans.commit()
            print("Migration completed successfully.")
        except Exception as e:
            trans.rollback()
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
