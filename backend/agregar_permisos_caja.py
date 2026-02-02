"""
Script para agregar permisos del módulo de Caja al rol admin

Ejecutar: python agregar_permisos_caja.py
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

PERMISOS_CAJA = [
    ('caja.ver', 'Ver Caja', 'caja', 'Permite ver estado de caja, facturas y reportes de ventas'),
    ('caja.apertura', 'Abrir Caja', 'caja', 'Permite abrir una nueva caja'),
    ('caja.cierre', 'Cerrar Caja', 'caja', 'Permite cerrar una caja'),
    ('caja.facturar', 'Crear Facturas', 'caja', 'Permite crear facturas'),
    ('caja.anular', 'Anular Facturas', 'caja', 'Permite anular facturas'),
    ('caja.aprobar_pendientes', 'Aprobar Pendientes', 'caja', 'Permite aprobar/rechazar servicios pendientes'),
    ('config.editar', 'Editar Configuración', 'configuracion', 'Permite editar configuración del sistema'),
]


def run():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Obtener ID del rol admin
        result = conn.execute(text("SELECT id FROM roles WHERE nombre = 'Administrador'"))
        row = result.fetchone()
        if not row:
            print("Error: No se encontró el rol 'admin'")
            return
        admin_rol_id = row[0]
        print(f"Rol admin encontrado: ID {admin_rol_id}")
        
        # Insertar permisos
        for codigo, nombre, modulo, descripcion in PERMISOS_CAJA:
            # Verificar si ya existe
            result = conn.execute(
                text("SELECT id FROM permisos WHERE codigo = :codigo"),
                {"codigo": codigo}
            )
            existing = result.fetchone()
            
            if existing:
                permiso_id = existing[0]
                print(f"  - Permiso '{codigo}' ya existe (ID: {permiso_id})")
            else:
                # Insertar permiso
                conn.execute(text("""
                    INSERT INTO permisos (codigo, nombre, modulo, descripcion)
                    VALUES (:codigo, :nombre, :modulo, :descripcion)
                """), {
                    "codigo": codigo,
                    "nombre": nombre,
                    "modulo": modulo,
                    "descripcion": descripcion
                })
                
                # Obtener ID del permiso insertado
                result = conn.execute(
                    text("SELECT id FROM permisos WHERE codigo = :codigo"),
                    {"codigo": codigo}
                )
                permiso_id = result.fetchone()[0]
                print(f"  [OK] Permiso '{codigo}' creado (ID: {permiso_id})")
            
            # Asignar al rol admin si no está asignado
            result = conn.execute(text("""
                SELECT 1 FROM rol_permisos 
                WHERE rol_id = :rol_id AND permiso_id = :permiso_id
            """), {"rol_id": admin_rol_id, "permiso_id": permiso_id})
            
            if not result.fetchone():
                conn.execute(text("""
                    INSERT INTO rol_permisos (rol_id, permiso_id)
                    VALUES (:rol_id, :permiso_id)
                """), {"rol_id": admin_rol_id, "permiso_id": permiso_id})
                print(f"    [OK] Asignado al rol admin")
            else:
                print(f"    - Ya asignado al rol admin")
        
        conn.commit()
        print("\n[OK] Permisos agregados exitosamente!")


if __name__ == "__main__":
    run()
