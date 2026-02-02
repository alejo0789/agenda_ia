# Script para agregar la columna fecha_asignacion a la tabla cliente_etiqueta_asignacion
import sys
sys.path.append('.')

from app.database import engine
from sqlalchemy import text

# Ejecutar la migración
with engine.connect() as conn:
    try:
        # Verificar si la columna existe
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'cliente_etiqueta_asignacion' 
            AND column_name = 'fecha_asignacion'
        """))
        
        if result.fetchone() is None:
            print("Agregando columna fecha_asignacion...")
            conn.execute(text("""
                ALTER TABLE cliente_etiqueta_asignacion 
                ADD COLUMN fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            """))
            conn.commit()
            print("✓ Columna fecha_asignacion agregada correctamente")
        else:
            print("✓ La columna fecha_asignacion ya existe")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
