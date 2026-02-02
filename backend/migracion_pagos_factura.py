"""
Script de migración para crear la tabla pagos_factura y configuraciones necesarias
para el módulo de caja.

Ejecutar: python migracion_pagos_factura.py
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def run_migration():
    """Ejecuta la migración de base de datos para pagos_factura"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # 1. Crear tabla pagos_factura
        print("Creando tabla pagos_factura...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS pagos_factura (
                id SERIAL PRIMARY KEY,
                factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
                metodo_pago_id INTEGER NOT NULL REFERENCES metodos_pago(id),
                monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
                referencia_pago VARCHAR(100),
                fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                usuario_id INTEGER REFERENCES usuarios(id),
                CONSTRAINT chk_pago_monto_positivo CHECK (monto > 0)
            );
        """))
        print("[OK] Tabla pagos_factura creada")
        
        # 2. Crear índices
        print("Creando índices...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pagos_factura_factura ON pagos_factura(factura_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pagos_factura_metodo ON pagos_factura(metodo_pago_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pagos_factura_fecha ON pagos_factura(fecha_pago);
        """))
        print("[OK] Indices creados")
        
        # 3. Hacer metodo_pago_id opcional en facturas (para nuevas facturas con pagos múltiples)
        print("Modificando tabla facturas...")
        conn.execute(text("""
            ALTER TABLE facturas ALTER COLUMN metodo_pago_id DROP NOT NULL;
        """))
        print("[OK] Tabla facturas modificada")
        
        # 4. Insertar configuraciones necesarias
        print("Insertando configuraciones...")
        
        # Verificar si ya existen las configuraciones
        result = conn.execute(text("SELECT clave FROM configuracion WHERE clave IN ('prefijo_factura', 'siguiente_numero_factura', 'impuesto_iva', 'dias_anular_factura')"))
        existing_keys = [row[0] for row in result]
        
        configs = [
            ('prefijo_factura', 'FAC', 'texto', 'Prefijo para números de factura'),
            ('siguiente_numero_factura', '1', 'numero', 'Siguiente número de factura'),
            ('impuesto_iva', '19', 'numero', 'Porcentaje de IVA'),
            ('dias_anular_factura', '1', 'numero', 'Días límite para anular facturas')
        ]
        
        for clave, valor, tipo, descripcion in configs:
            if clave not in existing_keys:
                conn.execute(text("""
                    INSERT INTO configuracion (clave, valor, tipo, descripcion) 
                    VALUES (:clave, :valor, :tipo, :descripcion)
                """), {"clave": clave, "valor": valor, "tipo": tipo, "descripcion": descripcion})
                print(f"  [OK] Configuracion '{clave}' insertada")
            else:
                print(f"  - Configuración '{clave}' ya existe")
        
        # 5. Insertar métodos de pago por defecto si no existen
        print("Verificando métodos de pago...")
        result = conn.execute(text("SELECT COUNT(*) FROM metodos_pago"))
        count = result.scalar()
        
        if count == 0:
            metodos = [
                ('Efectivo', True, False),
                ('Tarjeta Débito', True, True),
                ('Tarjeta Crédito', True, True),
                ('Transferencia', True, True),
                ('Nequi', True, True),
                ('Daviplata', True, True)
            ]
            for nombre, activo, requiere_ref in metodos:
                conn.execute(text("""
                    INSERT INTO metodos_pago (nombre, activo, requiere_referencia) 
                    VALUES (:nombre, :activo, :requiere_ref)
                """), {"nombre": nombre, "activo": activo, "requiere_ref": requiere_ref})
                print(f"  [OK] Metodo de pago '{nombre}' insertado")
        else:
            print(f"  - Ya existen {count} métodos de pago")
        
        # 6. Migrar datos existentes de facturas a pagos_factura
        print("Migrando pagos existentes...")
        result = conn.execute(text("""
            INSERT INTO pagos_factura (factura_id, metodo_pago_id, monto, referencia_pago, fecha_pago, usuario_id)
            SELECT 
                id,
                metodo_pago_id,
                total,
                referencia_pago,
                fecha,
                usuario_id
            FROM facturas
            WHERE metodo_pago_id IS NOT NULL 
              AND estado = 'pagada'
              AND id NOT IN (SELECT DISTINCT factura_id FROM pagos_factura)
        """))
        print(f"[OK] {result.rowcount} pagos migrados")
        
        conn.commit()
        print("\n[OK] Migracion completada exitosamente!")


if __name__ == "__main__":
    run_migration()
