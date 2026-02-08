import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add current directory to path to import app modules
sys.path.append(os.getcwd())

from app.config import settings

def fix_categorias_constraints():
    print(f"Conectando a {settings.database_url}...")
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        # 1. Eliminar la restricción de unicidad antigua si existe
        # En Postgres, SqlAlchemy suele crearla con el nombre de la columna o un nombre generado
        print("Buscando restricciones de unicidad antiguas...")
        
        # Intentar encontrar el nombre de la restricción única en la columna 'nombre'
        query = text("""
            SELECT conname
            FROM pg_constraint con
            INNER JOIN pg_class rel ON rel.oid = con.conrelid
            INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE rel.relname = 'categorias_servicio'
            AND con.contype = 'u'
            AND conname LIKE '%nombre%key%';
        """)
        
        result = conn.execute(query)
        constraints = [row[0] for row in result]
        
        for con in constraints:
            print(f"Eliminando restricción antigua: {con}")
            conn.execute(text(f'ALTER TABLE categorias_servicio DROP CONSTRAINT "{con}"'))
        
        # Si no se encontró por nombre estándar, intentar por la definición de la columna
        # A veces es un índice único en lugar de una restricción
        print("Buscando índices únicos en 'nombre'...")
        query_idx = text("""
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'categorias_servicio'
            AND indexdef LIKE '%UNIQUE%nombre%';
        """)
        result_idx = conn.execute(query_idx)
        indexes = [row[0] for row in result_idx]
        
        for idx in indexes:
            print(f"Eliminando índice único antiguo: {idx}")
            conn.execute(text(f'DROP INDEX "{idx}"'))

        # 2. Corregir registros con sede_id NULL
        # Buscamos la primera sede para asignar los huérfanos
        print("Corrigiendo sede_id nulos...")
        result_sede = conn.execute(text("SELECT id FROM sedes LIMIT 1"))
        first_sede = result_sede.fetchone()
        
        if first_sede:
            sede_id = first_sede[0]
            print(f"Asignando categorías sin sede a la sede con ID: {sede_id}")
            conn.execute(text("UPDATE categorias_servicio SET sede_id = :sede WHERE sede_id IS NULL"), {"sede": sede_id})
        else:
            print("ADVERTENCIA: No se encontró ninguna sede en la tabla 'sedes'.")

        # 3. Eliminar duplicados si existen (mismo nombre y misma sede) antes de crear la restricción
        print("Eliminando duplicados antes de aplicar la nueva restricción...")
        conn.execute(text("""
            DELETE FROM categorias_servicio a
            WHERE a.id > (
                SELECT MIN(b.id)
                FROM categorias_servicio b
                WHERE a.nombre = b.nombre 
                AND (a.sede_id = b.sede_id OR (a.sede_id IS NULL AND b.sede_id IS NULL))
            )
        """))

        # 4. Crear la nueva restricción compuesta
        print("Creando nueva restricción única compuesta (nombre, sede_id)...")
        try:
            conn.execute(text("""
                ALTER TABLE categorias_servicio 
                ADD CONSTRAINT uq_categoria_nombre_sede UNIQUE (nombre, sede_id)
            """))
            print("Restricción uq_categoria_nombre_sede creada exitosamente.")
        except Exception as e:
            print(f"Error al crear la restricción (podría ya existir): {e}")

        conn.commit()
    
    print("Corrección completada.")

if __name__ == "__main__":
    fix_categorias_constraints()
