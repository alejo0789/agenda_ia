# -*- coding: utf-8 -*-
"""
Script para corregir la tabla movimientos_inventario
La tabla existente tiene columnas diferentes, necesitamos recrearla
"""
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

# Obtener la URL de la base de datos
DATABASE_URL = os.getenv("DATABASE_URL")

# Parsear la URL para psycopg2
if DATABASE_URL:
    db_url = DATABASE_URL.replace("postgresql://", "")
    user_pass, host_db = db_url.split("@")
    user, password = user_pass.split(":")
    host_port, dbname = host_db.split("/")
    if ":" in host_port:
        host, port = host_port.split(":")
    else:
        host = host_port
        port = "5432"
else:
    print("ERROR: DATABASE_URL no esta configurada en .env")
    exit(1)

print(f"Conectando a la base de datos: {dbname} en {host}:{port}")

try:
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=dbname,
        user=user,
        password=password
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Verificar las columnas actuales de la tabla
    print("\n=== Verificando estructura actual de movimientos_inventario ===")
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'movimientos_inventario'
        ORDER BY ordinal_position;
    """)
    
    rows = cursor.fetchall()
    existing_columns = {row[0] for row in rows}
    print(f"Columnas existentes: {existing_columns}")
    
    # La tabla tiene estructura antigua, necesitamos actualizarla
    # Columnas antiguas: cantidad_anterior, cantidad, cantidad_nueva, fecha, usuario_id, id, tipo, motivo, producto_id, documento_referencia
    # Columnas nuevas: id, producto_id, tipo_movimiento, cantidad, ubicacion_origen_id, ubicacion_destino_id, venta_id, costo_unitario, costo_total, motivo, referencia, usuario_id, fecha_movimiento
    
    print("\n=== Verificando si hay datos en la tabla ===")
    cursor.execute("SELECT COUNT(*) FROM movimientos_inventario;")
    count = cursor.fetchone()[0]
    print(f"Registros existentes: {count}")
    
    if count == 0:
        print("\n=== Tabla vacia, se puede recrear ===")
        
        # Eliminar la tabla antigua
        print("Eliminando tabla antigua...")
        cursor.execute("DROP TABLE IF EXISTS movimientos_inventario CASCADE;")
        print("  [OK] Tabla eliminada")
        
        # Crear la tabla nueva
        print("\nCreando tabla con estructura correcta...")
        cursor.execute("""
            CREATE TABLE movimientos_inventario (
                id SERIAL PRIMARY KEY,
                producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
                tipo_movimiento VARCHAR(30) NOT NULL,
                cantidad INTEGER NOT NULL,
                ubicacion_origen_id INTEGER REFERENCES ubicaciones_inventario(id) ON DELETE SET NULL,
                ubicacion_destino_id INTEGER REFERENCES ubicaciones_inventario(id) ON DELETE SET NULL,
                venta_id INTEGER,
                costo_unitario NUMERIC(10, 2),
                costo_total NUMERIC(10, 2),
                motivo TEXT,
                referencia VARCHAR(100),
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
                fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)
        print("  [OK] Tabla creada")
        
        # Crear indices
        print("\nCreando indices...")
        indices = [
            ("ix_movimientos_inventario_id", "CREATE INDEX ix_movimientos_inventario_id ON movimientos_inventario(id);"),
            ("ix_movimientos_tipo_movimiento", "CREATE INDEX ix_movimientos_tipo_movimiento ON movimientos_inventario(tipo_movimiento);"),
            ("ix_movimientos_fecha_movimiento", "CREATE INDEX ix_movimientos_fecha_movimiento ON movimientos_inventario(fecha_movimiento);"),
            ("ix_movimientos_producto_fecha", "CREATE INDEX ix_movimientos_producto_fecha ON movimientos_inventario(producto_id, fecha_movimiento);"),
            ("ix_movimientos_tipo_fecha", "CREATE INDEX ix_movimientos_tipo_fecha ON movimientos_inventario(tipo_movimiento, fecha_movimiento);"),
        ]
        
        for index_name, sql in indices:
            cursor.execute(sql)
            print(f"  [OK] Indice '{index_name}' creado")
        
        # Crear constraints
        print("\nCreando constraints...")
        cursor.execute("""
            ALTER TABLE movimientos_inventario 
            ADD CONSTRAINT chk_movimiento_tipo 
            CHECK (tipo_movimiento IN ('compra', 'venta', 'ajuste_positivo', 'ajuste_negativo', 
                                       'transferencia', 'uso_interno', 'devolucion', 'merma', 
                                       'muestra', 'donacion'));
        """)
        print("  [OK] Constraint 'chk_movimiento_tipo' creado")
        
        cursor.execute("""
            ALTER TABLE movimientos_inventario 
            ADD CONSTRAINT chk_movimiento_cantidad 
            CHECK (cantidad > 0);
        """)
        print("  [OK] Constraint 'chk_movimiento_cantidad' creado")
        
    else:
        print("\n=== La tabla tiene datos, agregando columnas faltantes ===")
        
        # Agregar columnas faltantes sin perder datos
        columns_to_add = []
        
        if 'tipo_movimiento' not in existing_columns:
            if 'tipo' in existing_columns:
                # Renombrar columna tipo a tipo_movimiento
                cursor.execute("ALTER TABLE movimientos_inventario RENAME COLUMN tipo TO tipo_movimiento;")
                print("  [OK] Columna 'tipo' renombrada a 'tipo_movimiento'")
            else:
                cursor.execute("ALTER TABLE movimientos_inventario ADD COLUMN tipo_movimiento VARCHAR(30) DEFAULT 'ajuste_positivo';")
                print("  [OK] Columna 'tipo_movimiento' agregada")
        
        if 'ubicacion_origen_id' not in existing_columns:
            cursor.execute("ALTER TABLE movimientos_inventario ADD COLUMN ubicacion_origen_id INTEGER REFERENCES ubicaciones_inventario(id) ON DELETE SET NULL;")
            print("  [OK] Columna 'ubicacion_origen_id' agregada")
        
        if 'ubicacion_destino_id' not in existing_columns:
            cursor.execute("ALTER TABLE movimientos_inventario ADD COLUMN ubicacion_destino_id INTEGER REFERENCES ubicaciones_inventario(id) ON DELETE SET NULL;")
            print("  [OK] Columna 'ubicacion_destino_id' agregada")
        
        if 'venta_id' not in existing_columns:
            cursor.execute("ALTER TABLE movimientos_inventario ADD COLUMN venta_id INTEGER;")
            print("  [OK] Columna 'venta_id' agregada")
        
        if 'costo_unitario' not in existing_columns:
            cursor.execute("ALTER TABLE movimientos_inventario ADD COLUMN costo_unitario NUMERIC(10, 2);")
            print("  [OK] Columna 'costo_unitario' agregada")
        
        if 'costo_total' not in existing_columns:
            cursor.execute("ALTER TABLE movimientos_inventario ADD COLUMN costo_total NUMERIC(10, 2);")
            print("  [OK] Columna 'costo_total' agregada")
        
        if 'referencia' not in existing_columns:
            if 'documento_referencia' in existing_columns:
                cursor.execute("ALTER TABLE movimientos_inventario RENAME COLUMN documento_referencia TO referencia;")
                print("  [OK] Columna 'documento_referencia' renombrada a 'referencia'")
            else:
                cursor.execute("ALTER TABLE movimientos_inventario ADD COLUMN referencia VARCHAR(100);")
                print("  [OK] Columna 'referencia' agregada")
        
        if 'fecha_movimiento' not in existing_columns:
            if 'fecha' in existing_columns:
                cursor.execute("ALTER TABLE movimientos_inventario RENAME COLUMN fecha TO fecha_movimiento;")
                print("  [OK] Columna 'fecha' renombrada a 'fecha_movimiento'")
            else:
                cursor.execute("ALTER TABLE movimientos_inventario ADD COLUMN fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW();")
                print("  [OK] Columna 'fecha_movimiento' agregada")
    
    # Mostrar estructura final
    print("\n=== Estructura final de movimientos_inventario ===")
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'movimientos_inventario'
        ORDER BY ordinal_position;
    """)
    
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]} (nullable: {row[2]})")
    
    cursor.close()
    conn.close()
    
    print("\n[OK] Script completado exitosamente!")
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
