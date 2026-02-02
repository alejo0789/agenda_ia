"""
Script para agregar columna 'stock_maximo' a la tabla productos
"""
from sqlalchemy import text
from app.database import engine

def main():
    with engine.connect() as conn:
        # Verificar si la columna existe
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'productos' AND column_name = 'stock_maximo'
        """))
        
        if result.fetchone():
            print("[=] La columna 'stock_maximo' ya existe en la tabla productos")
        else:
            print("[+] Agregando columna 'stock_maximo' a la tabla productos...")
            conn.execute(text("ALTER TABLE productos ADD COLUMN stock_maximo INTEGER"))
            conn.commit()
            print("[OK] Columna 'stock_maximo' agregada exitosamente")

if __name__ == "__main__":
    main()
