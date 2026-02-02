# Script para agregar permisos de clientes al rol admin
import sys
sys.path.append('.')

from app.database import SessionLocal
from app.models.auth import Permiso, RolPermiso
from app.models.user import Rol

db = SessionLocal()

try:
    # Permisos de clientes a crear
    permisos_clientes = [
        {"nombre": "clientes.ver", "descripcion": "Ver listado de clientes"},
        {"nombre": "clientes.crear", "descripcion": "Crear nuevos clientes"},
        {"nombre": "clientes.editar", "descripcion": "Editar clientes existentes"},
        {"nombre": "clientes.eliminar", "descripcion": "Eliminar/desactivar clientes"},
    ]
    
    # Obtener el rol admin
    rol_admin = db.query(Rol).filter(Rol.nombre == "admin").first()
    if not rol_admin:
        print("❌ No se encontró el rol 'admin'")
        # Buscar cualquier rol
        roles = db.query(Rol).all()
        print(f"Roles disponibles: {[r.nombre for r in roles]}")
    else:
        print(f"✓ Rol admin encontrado: ID={rol_admin.id}")
    
    # Crear permisos si no existen
    permisos_creados = []
    for perm_data in permisos_clientes:
        permiso = db.query(Permiso).filter(Permiso.nombre == perm_data["nombre"]).first()
        if not permiso:
            permiso = Permiso(nombre=perm_data["nombre"], descripcion=perm_data["descripcion"])
            db.add(permiso)
            db.flush()
            print(f"✓ Permiso creado: {perm_data['nombre']}")
        else:
            print(f"  Permiso ya existe: {perm_data['nombre']}")
        permisos_creados.append(permiso)
    
    # Asignar permisos al rol admin
    if rol_admin:
        for permiso in permisos_creados:
            # Verificar si ya está asignado
            asignacion = db.query(RolPermiso).filter(
                RolPermiso.rol_id == rol_admin.id,
                RolPermiso.permiso_id == permiso.id
            ).first()
            
            if not asignacion:
                asignacion = RolPermiso(rol_id=rol_admin.id, permiso_id=permiso.id)
                db.add(asignacion)
                print(f"✓ Permiso '{permiso.nombre}' asignado al rol admin")
            else:
                print(f"  Permiso '{permiso.nombre}' ya asignado al rol admin")
    
    db.commit()
    print("\n✅ Permisos de clientes configurados correctamente!")
    
    # Verificar permisos del rol admin
    if rol_admin:
        permisos_admin = db.query(Permiso).join(RolPermiso).filter(
            RolPermiso.rol_id == rol_admin.id
        ).all()
        print(f"\nPermisos del rol admin ({len(permisos_admin)}):")
        for p in permisos_admin:
            print(f"  - {p.nombre}")
            
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
    import traceback
    traceback.print_exc()
finally:
    db.close()
