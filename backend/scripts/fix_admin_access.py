
import sys
import os

# Add parent dir to path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

def fix_admin_access():
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            # Asumimos que el admin es el id 1 o username 'admin'
            # Vamos a actualizar a todos los usuarios que ya tenían password (hash no nulo) a primer_acceso = false
            # Pero en este sistema todos tenían password.
            # Simplemente actualizaremos al admin por username y id 1 por seguridad
            
            print("Updating 'primer_acceso' to FALSE for admin user...")
            
            # Actualizar por username admin
            result = connection.execute(text("UPDATE usuarios SET primer_acceso = FALSE WHERE username = 'admin'"))
            print(f"Updated {result.rowcount} rows for username 'admin'.")
            
            # Actualizar por id 1 si es diferente
            result = connection.execute(text("UPDATE usuarios SET primer_acceso = FALSE WHERE id = 1"))
            print(f"Updated {result.rowcount} rows for id 1.")

            trans.commit()
            print("Fix completed successfully.")
        except Exception as e:
            trans.rollback()
            print(f"Fix failed: {e}")

if __name__ == "__main__":
    fix_admin_access()
