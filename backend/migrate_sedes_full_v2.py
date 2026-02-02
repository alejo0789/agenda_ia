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
            # Empezamos una subtransacción interna
            with conn.begin():
                # 1. Agregar columna sede_id
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN sede_id INTEGER REFERENCES sedes(id);"))
                print(f"  Column 'sede_id' added to {table}.")
                
                # 2. Asignar sede por defecto (1 - Cali) para registros existentes
                conn.execute(text(f"UPDATE {table} SET sede_id = 1 WHERE sede_id IS NULL;"))
                print(f"  Existing records in {table} assigned to Sede 1.")
            
        except Exception as e:
            if "already exists" in str(e) or "ya existe" in str(e):
                print(f"  Column already exists in {table}, ensuring values are set...")
                try:
                    with conn.begin():
                        conn.execute(text(f"UPDATE {table} SET sede_id = 1 WHERE sede_id IS NULL;"))
                        print(f"  Existing records in {table} assigned to Sede 1.")
                except Exception as ex:
                    print(f"  Error updating {table}: {ex}")
            else:
                print(f"  Error in {table}: {e}")
            
    print("Migración finalizada.")
