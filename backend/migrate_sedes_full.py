from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres:root@localhost:5432/club_alisados"
engine = create_engine(DATABASE_URL)

TABLES_TO_MIGRATE = [
    "cajas",
    "facturas",
    "facturas_pendientes",
    "especialistas",
    "clientes",
    "servicios",
    "productos",
    "ubicaciones_inventario",
    "categorias_servicio"
]

with engine.connect() as conn:
    print("Iniciando migración de sedes...")
    for table in TABLES_TO_MIGRATE:
        print(f"Migrando tabla: {table}")
        try:
            # 1. Agregar columna sede_id
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN sede_id INTEGER REFERENCES sedes(id);"))
            print(f"  Column 'sede_id' added to {table}.")
            
            # 2. Asignar sede por defecto (1 - Cali) para registros existentes
            conn.execute(text(f"UPDATE {table} SET sede_id = 1 WHERE sede_id IS NULL;"))
            print(f"  Existing records in {table} assigned to Sede 1.")
            
            # 3. Hacer sede_id NOT NULL después de asignar valores
            # (Opcional, pero recomendado para integridad)
            # conn.execute(text(f"ALTER TABLE {table} ALTER COLUMN sede_id SET NOT NULL;"))
            
        except Exception as e:
            print(f"  Error or already exists in {table}: {e}")
            
    conn.commit()
    print("Migración finalizada.")
