# Script para arreglar la tabla de citas
import sys
sys.path.append('.')

from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        # Verificar columnas existentes
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'citas'
        """))
        columnas_existentes = [row[0] for row in result.fetchall()]
        print(f"Columnas existentes: {columnas_existentes}")
        
        # Columnas que deberían existir
        columnas_requeridas = {
            'duracion_minutos': 'INTEGER DEFAULT 60',
            'hora_fin': 'TIME',
            'notas_internas': 'TEXT',
            'precio': 'INTEGER DEFAULT 0',
            'fecha_creacion': 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
            'fecha_actualizacion': 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        }
        
        for columna, tipo in columnas_requeridas.items():
            if columna not in columnas_existentes:
                print(f"Agregando columna: {columna}")
                conn.execute(text(f"ALTER TABLE citas ADD COLUMN {columna} {tipo}"))
                conn.commit()
                print(f"✓ Columna {columna} agregada")
            else:
                print(f"- Columna {columna} ya existe")
        
        print("\n✅ Tabla de citas corregida")
        
        # Mostrar estructura final
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'citas'
            ORDER BY ordinal_position
        """))
        print("\nEstructura final de la tabla citas:")
        for row in result.fetchall():
            print(f"  - {row[0]}: {row[1]} (nullable: {row[2]})")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
