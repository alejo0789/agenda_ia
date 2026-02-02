"""
Script para crear las tablas de abonos y agregar permisos.

Ejecutar directamente:
    python crear_tablas_abonos.py
"""
import sys
import os

# Agregar el path del proyecto
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

# SQL para crear las tablas
CREATE_TABLES_SQL = """
-- Tabla de abonos
CREATE TABLE IF NOT EXISTS abonos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    monto DECIMAL(12, 2) NOT NULL,
    saldo_disponible DECIMAL(12, 2) NOT NULL,
    cita_id INTEGER REFERENCES citas(id),
    metodo_pago_id INTEGER NOT NULL REFERENCES metodos_pago(id),
    referencia_pago VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible',
    concepto TEXT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT abonos_monto_positivo CHECK (monto > 0),
    CONSTRAINT abonos_saldo_positivo CHECK (saldo_disponible >= 0),
    CONSTRAINT abonos_saldo_menor_monto CHECK (saldo_disponible <= monto),
    CONSTRAINT abonos_estado_check CHECK (estado IN ('disponible', 'usado', 'anulado'))
);

-- Indices para abonos
CREATE INDEX IF NOT EXISTS idx_abonos_cliente ON abonos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_abonos_cita ON abonos(cita_id);
CREATE INDEX IF NOT EXISTS idx_abonos_estado ON abonos(estado);

-- Tabla de redenciones de abonos
CREATE TABLE IF NOT EXISTS redenciones_abono (
    id SERIAL PRIMARY KEY,
    abono_id INTEGER NOT NULL REFERENCES abonos(id) ON DELETE CASCADE,
    factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    monto_aplicado DECIMAL(12, 2) NOT NULL,
    fecha_aplicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT redenciones_monto_positivo CHECK (monto_aplicado > 0)
);

-- Indices para redenciones
CREATE INDEX IF NOT EXISTS idx_redenciones_abono ON redenciones_abono(abono_id);
CREATE INDEX IF NOT EXISTS idx_redenciones_factura ON redenciones_abono(factura_id);
"""

# Permisos de abonos (codigo, nombre, modulo, descripcion)
PERMISOS_ABONOS = [
    ('abonos.ver', 'Ver Abonos', 'Abonos', 'Ver abonos de clientes'),
    ('abonos.crear', 'Crear Abonos', 'Abonos', 'Crear nuevos abonos'),
    ('abonos.anular', 'Anular Abonos', 'Abonos', 'Anular abonos'),
]

# Permisos adicionales para edicion de facturas
PERMISOS_FACTURAS = [
    ('facturas.editar', 'Editar Facturas', 'Facturas', 'Editar facturas existentes'),
]


def crear_tablas():
    """Crea las tablas de abonos"""
    print("=" * 60)
    print("CREANDO TABLAS DE ABONOS")
    print("=" * 60)
    
    with engine.connect() as conn:
        try:
            for statement in CREATE_TABLES_SQL.split(';'):
                statement = statement.strip()
                if statement:
                    conn.execute(text(statement))
            conn.commit()
            print("[OK] Tablas creadas exitosamente")
        except Exception as e:
            print(f"[ERROR] Error creando tablas: {e}")
            raise


def agregar_permisos():
    """Agrega los permisos de abonos usando SQL directo"""
    print("\n" + "=" * 60)
    print("AGREGANDO PERMISOS DE ABONOS")
    print("=" * 60)
    
    todos_permisos = PERMISOS_ABONOS + PERMISOS_FACTURAS
    
    with engine.connect() as conn:
        try:
            for codigo, nombre, modulo, descripcion in todos_permisos:
                result = conn.execute(text(
                    "SELECT id FROM permisos WHERE codigo = :codigo"
                ), {"codigo": codigo})
                existe = result.fetchone()
                
                if existe:
                    print(f"[SKIP] Permiso '{codigo}' ya existe")
                    continue
                
                conn.execute(text(
                    "INSERT INTO permisos (codigo, nombre, modulo, descripcion) VALUES (:codigo, :nombre, :modulo, :descripcion)"
                ), {"codigo": codigo, "nombre": nombre, "modulo": modulo, "descripcion": descripcion})
                print(f"[OK] Permiso '{codigo}' creado")
            
            conn.commit()
            print("\n[OK] Permisos agregados exitosamente")
            
        except Exception as e:
            print(f"[ERROR] Error agregando permisos: {e}")
            raise


def asignar_permisos_admin():
    """Asigna todos los permisos de abonos al rol admin usando SQL directo"""
    print("\n" + "=" * 60)
    print("ASIGNANDO PERMISOS AL ROL ADMIN")
    print("=" * 60)
    
    todos_permisos = PERMISOS_ABONOS + PERMISOS_FACTURAS
    
    with engine.connect() as conn:
        try:
            # Buscar rol admin por varios nombres posibles
            result = conn.execute(text("SELECT id, nombre FROM roles"))
            roles = result.fetchall()
            
            print(f"Roles encontrados: {[r[1] for r in roles]}")
            
            # Buscar el rol admin
            admin_id = None
            for rol_id, rol_nombre in roles:
                if rol_nombre.lower() in ['admin', 'administrador', 'superadmin']:
                    admin_id = rol_id
                    print(f"[OK] Usando rol '{rol_nombre}' (id={rol_id})")
                    break
            
            if not admin_id:
                print("[ERROR] No se encontro rol admin, asignando al primer rol...")
                if roles:
                    admin_id = roles[0][0]
                    print(f"[OK] Usando rol '{roles[0][1]}' (id={admin_id})")
                else:
                    print("[ERROR] No hay roles en la base de datos")
                    return
            
            for codigo, _, _, _ in todos_permisos:
                result = conn.execute(text(
                    "SELECT id FROM permisos WHERE codigo = :codigo"
                ), {"codigo": codigo})
                permiso = result.fetchone()
                
                if not permiso:
                    continue
                
                permiso_id = permiso[0]
                
                result = conn.execute(text(
                    "SELECT COUNT(*) FROM rol_permisos WHERE rol_id = :rol_id AND permiso_id = :permiso_id"
                ), {"rol_id": admin_id, "permiso_id": permiso_id})
                count = result.fetchone()[0]
                
                if count > 0:
                    print(f"[SKIP] Permiso '{codigo}' ya asignado a admin")
                    continue
                
                conn.execute(text(
                    "INSERT INTO rol_permisos (rol_id, permiso_id) VALUES (:rol_id, :permiso_id)"
                ), {"rol_id": admin_id, "permiso_id": permiso_id})
                print(f"[OK] Permiso '{codigo}' asignado a admin")
            
            conn.commit()
            print("\n[OK] Permisos asignados al rol admin")
            
        except Exception as e:
            print(f"[ERROR] Error asignando permisos: {e}")
            raise


def main():
    """Ejecuta todas las migraciones"""
    print("\n" + "=" * 60)
    print("MIGRACION: SISTEMA DE ABONOS")
    print("=" * 60 + "\n")
    
    try:
        crear_tablas()
        agregar_permisos()
        asignar_permisos_admin()
        
        print("\n" + "=" * 60)
        print("[OK] MIGRACION COMPLETADA EXITOSAMENTE")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] Error en la migracion: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
