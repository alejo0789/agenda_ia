import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No se encontró DATABASE_URL en el entorno.")
    exit(1)

engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        with conn.begin():
            # Crear especialista_lizto_mapping
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS especialista_lizto_mapping (
                especialista_id   INTEGER PRIMARY KEY REFERENCES especialistas(id) ON DELETE CASCADE,
                lizto_staff_id    INTEGER NOT NULL,
                lizto_staff_name  VARCHAR(150),
                fecha_creacion    TIMESTAMP DEFAULT NOW()
            );
            """))
            print("Tabla especialista_lizto_mapping creada o verificada.")

            # Crear servicio_lizto_mapping
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS servicio_lizto_mapping (
                servicio_id       INTEGER PRIMARY KEY REFERENCES servicios(id) ON DELETE CASCADE,
                lizto_service_id  INTEGER NOT NULL,
                lizto_price_id    INTEGER NOT NULL,
                lizto_price_value DECIMAL(12,2) NOT NULL,
                lizto_service_name VARCHAR(150),
                fecha_creacion    TIMESTAMP DEFAULT NOW()
            );
            """))
            print("Tabla servicio_lizto_mapping creada o verificada.")

            # Crear lizto_config
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS lizto_config (
                key   VARCHAR(100) PRIMARY KEY,
                value VARCHAR(500) NOT NULL
            );
            """))
            print("Tabla lizto_config creada o verificada.")

            # Insertar valores por defecto en lizto_config si no existen
            conn.execute(text("""
            INSERT INTO lizto_config (key, value) VALUES
              ('location_id', '8'),
              ('register_id', '8'),
              ('user_id', '189')
            ON CONFLICT (key) DO NOTHING;
            """))
            print("Valores por defecto en lizto_config verificados.")

            # Añadir columna lizto_reservation_id a citas
            try:
                # Comprobar si la columna existe en PostgreSQL / MySQL
                # Esto es genérico para PostgreSQL:
                res = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='citas' AND column_name='lizto_reservation_id';
                """))
                if not res.fetchone():
                    conn.execute(text("""
                    ALTER TABLE citas ADD COLUMN lizto_reservation_id VARCHAR(50);
                    """))
                    print("Columna lizto_reservation_id agregada a citas.")
                else:
                    print("La columna lizto_reservation_id ya existe en citas.")
            except Exception as e:
                print(f"Error al agregar lizto_reservation_id: {e}")

if __name__ == "__main__":
    run_migration()
