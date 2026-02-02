# Script para agregar la columna cedula a la tabla clientes
import sys
sys.path.append('.')

from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        # Verificar si la columna existe
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'clientes' 
            AND column_name = 'cedula'
        """))
        
        if result.fetchone() is None:
            print("Agregando columna cedula a la tabla clientes...")
            conn.execute(text("""
                ALTER TABLE clientes 
                ADD COLUMN cedula VARCHAR(20) UNIQUE
            """))
            conn.commit()
            print("✓ Columna cedula agregada correctamente")
            
            # Crear índice
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_clientes_cedula ON clientes (cedula)
            """))
            conn.commit()
            print("✓ Índice creado para cedula")
        else:
            print("✓ La columna cedula ya existe")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
