from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres:root@localhost:5432/club_alisados"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Agregando columnas a la tabla facturas_pendientes...")
    try:
        conn.execute(text("ALTER TABLE facturas_pendientes ADD COLUMN tipo VARCHAR(20) DEFAULT 'servicio' NOT NULL;"))
        print("Columna 'tipo' agregada.")
    except Exception as e:
        print(f"Error o ya existe 'tipo': {e}")
        
    try:
        conn.execute(text("ALTER TABLE facturas_pendientes ADD COLUMN producto_id INTEGER REFERENCES productos(id);"))
        print("Columna 'producto_id' agregada.")
    except Exception as e:
        print(f"Error o ya existe 'producto_id': {e}")

    try:
        conn.execute(text("ALTER TABLE facturas_pendientes ADD COLUMN cantidad DECIMAL(12, 3) DEFAULT 1 NOT NULL;"))
        print("Columna 'cantidad' agregada.")
    except Exception as e:
        print(f"Error o ya existe 'cantidad': {e}")

    try:
        conn.execute(text("ALTER TABLE facturas_pendientes ALTER COLUMN servicio_id DROP NOT NULL;"))
        print("Columna 'servicio_id' ahora es nullable.")
    except Exception as e:
        print(f"Error al modificar 'servicio_id': {e}")
    
    conn.commit()
    print("Proceso finalizado.")
