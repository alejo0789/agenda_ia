"""Asignar permisos de abonos a todos los roles"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    # Obtener todos los roles
    result = conn.execute(text("SELECT id, nombre FROM roles"))
    roles = result.fetchall()
    print("Roles:", [r[1] for r in roles])
    
    # Obtener permisos de abonos
    result = conn.execute(text("SELECT id, codigo FROM permisos WHERE codigo LIKE 'abonos.%'"))
    permisos = result.fetchall()
    print("Permisos abonos:", [p[1] for p in permisos])
    
    # Asignar permisos a todos los roles
    for rol_id, rol_nombre in roles:
        for permiso_id, permiso_codigo in permisos:
            # Verificar si ya existe
            result = conn.execute(text(
                "SELECT COUNT(*) FROM rol_permisos WHERE rol_id = :rol_id AND permiso_id = :permiso_id"
            ), {"rol_id": rol_id, "permiso_id": permiso_id})
            count = result.fetchone()[0]
            
            if count == 0:
                conn.execute(text(
                    "INSERT INTO rol_permisos (rol_id, permiso_id) VALUES (:rol_id, :permiso_id)"
                ), {"rol_id": rol_id, "permiso_id": permiso_id})
                print(f"[OK] {permiso_codigo} asignado a {rol_nombre}")
            else:
                print(f"[SKIP] {permiso_codigo} ya asignado a {rol_nombre}")
    
    conn.commit()
    print("Listo!")
