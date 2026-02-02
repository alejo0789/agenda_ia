"""
Script para agregar columnas de precio_colaborador y comision_porcentaje a productos
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def agregar_columnas_productos():
    """Agrega las columnas precio_colaborador y comision_porcentaje a la tabla productos"""
    
    with engine.connect() as conn:
        # Verificar si las columnas ya existen
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'productos' 
            AND column_name IN ('precio_colaborador', 'comision_porcentaje')
        """))
        existing_columns = [row[0] for row in result.fetchall()]
        
        # Agregar precio_colaborador si no existe
        if 'precio_colaborador' not in existing_columns:
            print("Agregando columna precio_colaborador...")
            conn.execute(text("""
                ALTER TABLE productos 
                ADD COLUMN precio_colaborador NUMERIC(10, 2) DEFAULT 0
            """))
            print("✅ Columna precio_colaborador agregada")
        else:
            print("ℹ️ Columna precio_colaborador ya existe")
        
        # Agregar comision_porcentaje si no existe
        if 'comision_porcentaje' not in existing_columns:
            print("Agregando columna comision_porcentaje...")
            conn.execute(text("""
                ALTER TABLE productos 
                ADD COLUMN comision_porcentaje NUMERIC(5, 2) DEFAULT 0
            """))
            print("✅ Columna comision_porcentaje agregada")
        else:
            print("ℹ️ Columna comision_porcentaje ya existe")
        
        conn.commit()
        print("\n✅ Migración completada exitosamente")

if __name__ == "__main__":
    agregar_columnas_productos()
