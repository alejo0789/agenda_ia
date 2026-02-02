# Script para agregar permisos de agenda al rol admin
import sys
sys.path.append('.')

from app.database import SessionLocal
from app.models.auth import Permiso, RolPermiso
from app.models.user import Rol

db = SessionLocal()

try:
    # Permisos de agenda a crear (codigo, nombre, modulo, descripcion)
    permisos_agenda = [
        ("agenda.ver", "Ver Agenda", "agenda", "Ver agenda y citas"),
        ("agenda.crear", "Crear Citas", "agenda", "Crear citas"),
        ("agenda.editar", "Editar Citas", "agenda", "Editar citas"),
        ("agenda.eliminar", "Eliminar Citas", "agenda", "Eliminar citas"),
    ]
    
    # Obtener el rol admin
    rol_admin = db.query(Rol).filter(Rol.nombre == "admin").first()
    if not rol_admin:
        print("❌ No se encontró el rol 'admin'")
        # Buscar cualquier rol
        roles = db.query(Rol).all()
        print(f"Roles disponibles: {[r.nombre for r in roles]}")
        # Usar el primer rol encontrado
        if roles:
            rol_admin = roles[0]
            print(f"⚠️ Usando rol: {rol_admin.nombre}")
    else:
        print(f"✓ Rol admin encontrado: ID={rol_admin.id}")
    
    # Crear permisos si no existen
    permisos_creados = []
    for codigo, nombre, modulo, descripcion in permisos_agenda:
        permiso = db.query(Permiso).filter(Permiso.codigo == codigo).first()
        if not permiso:
            permiso = Permiso(codigo=codigo, nombre=nombre, modulo=modulo, descripcion=descripcion)
            db.add(permiso)
            db.flush()
            print(f"✓ Permiso creado: {codigo}")
        else:
            print(f"  Permiso ya existe: {codigo}")
        permisos_creados.append(permiso)
    
    # Asignar permisos al rol
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
                print(f"✓ Permiso '{permiso.codigo}' asignado al rol {rol_admin.nombre}")
            else:
                print(f"  Permiso '{permiso.codigo}' ya asignado al rol {rol_admin.nombre}")
    
    db.commit()
    print("\n✅ Permisos de agenda configurados correctamente!")
    
    # Verificar permisos del rol
    if rol_admin:
        permisos_rol = db.query(Permiso).join(RolPermiso).filter(
            RolPermiso.rol_id == rol_admin.id,
            Permiso.modulo == "agenda"
        ).all()
        print(f"\nPermisos de agenda del rol {rol_admin.nombre} ({len(permisos_rol)}):")
        for p in permisos_rol:
            print(f"  - {p.codigo}")
            
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
    import traceback
    traceback.print_exc()
finally:
    db.close()
