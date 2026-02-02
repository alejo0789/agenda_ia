"""
Script para agregar columna 'notas' a la tabla proveedores
"""
from sqlalchemy import text
from app.database import engine

def main():
    with engine.connect() as conn:
        # Verificar si la columna existe
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'proveedores' AND column_name = 'notas'
        """))
        
        if result.fetchone():
            print("[=] La columna 'notas' ya existe en la tabla proveedores")
        else:
            print("[+] Agregando columna 'notas' a la tabla proveedores...")
            conn.execute(text("ALTER TABLE proveedores ADD COLUMN notas TEXT"))
            conn.commit()
            print("[OK] Columna 'notas' agregada exitosamente")

if __name__ == "__main__":
    main()
