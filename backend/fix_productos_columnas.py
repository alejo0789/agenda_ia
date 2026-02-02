"""
Script para sincronizar la tabla productos con el modelo SQLAlchemy
Agrega todas las columnas faltantes
"""
from sqlalchemy import text
from app.database import engine

# Columnas que deben existir en la tabla productos
COLUMNAS_PRODUCTOS = [
    ('fecha_vencimiento', 'DATE'),
    ('lote', 'VARCHAR(50)'),
    ('imagen_url', 'VARCHAR(500)'),
]

def main():
    with engine.connect() as conn:
        for columna, tipo in COLUMNAS_PRODUCTOS:
            # Verificar si la columna existe
            result = conn.execute(text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'productos' AND column_name = '{columna}'
            """))
            
            if result.fetchone():
                print(f"[=] La columna '{columna}' ya existe")
            else:
                print(f"[+] Agregando columna '{columna}' ({tipo})...")
                conn.execute(text(f"ALTER TABLE productos ADD COLUMN {columna} {tipo}"))
                print(f"[OK] Columna '{columna}' agregada")
        
        conn.commit()
        print("\n[OK] Sincronizacion completada!")

if __name__ == "__main__":
    main()
