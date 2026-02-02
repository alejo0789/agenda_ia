from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres:root@localhost:5432/club_alisados"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Corrigiendo permisos para el rol Administrador...")
    
    # Obtener ID del rol Administrador
    result = conn.execute(text("SELECT id FROM roles WHERE nombre = 'Administrador'"))
    row = result.fetchone()
    if not row:
        print("Error: No se encontró el rol 'Administrador'")
    else:
        admin_rol_id = row[0]
        print(f"ID del rol Administrador: {admin_rol_id}")
        
        # Obtener todos los permisos que no tiene el administrador
        result = conn.execute(text("""
            SELECT id, codigo FROM permisos 
            WHERE id NOT IN (
                SELECT permiso_id FROM rol_permisos WHERE rol_id = :rol_id
            )
        """), {"rol_id": admin_rol_id})
        
        missing_perms = result.fetchall()
        
        if not missing_perms:
            print("El administrador ya tiene todos los permisos.")
        else:
            print(f"Asignando {len(missing_perms)} permisos faltantes...")
            for p_id, p_codigo in missing_perms:
                conn.execute(text("""
                    INSERT INTO rol_permisos (rol_id, permiso_id)
                    VALUES (:rol_id, :permiso_id)
                """), {"rol_id": admin_rol_id, "permiso_id": p_id})
                print(f"  - Asignado: {p_codigo}")
            
            conn.commit()
            print("Permisos actualizados exitosamente.")

    # Asegurar que Cajero tenga agenda.ver si no lo tiene (aunque parece que sí lo tiene)
    # Pero el usuario dijo que el administrador es el que no ve.
