
import os
import sys
from sqlalchemy import text, create_engine
from sqlalchemy.orm import Session

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import SessionLocal, engine, Base
from app.models.user import Usuario, Rol
from app.models.auth import Permiso, RolPermiso
from app.services.password_service import PasswordService

def init_system():
    print("\n" + "="*60)
    print("  INICIALIZANDO SISTEMA - CONFIGURACIÓN COMPLETA DE PERMISOS")
    print("="*60 + "\n")

    # Asegurar que las tablas existan
    print("[1/4] Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Crear Roles Básicos
        print("[2/4] Configurando roles...")
        roles_data = [
            {"id": 1, "nombre": "Super Administrador", "descripcion": "Acceso total al sistema y gestión de sedes", "es_sistema": True},
            {"id": 2, "nombre": "Administrador", "descripcion": "Administrador de sede", "es_sistema": True},
            {"id": 3, "nombre": "Cajero", "descripcion": "Gestión de caja y facturación", "es_sistema": True},
            {"id": 4, "nombre": "Recepcionista", "descripcion": "Gestión de citas y clientes", "es_sistema": True}
        ]
        
        for r_data in roles_data:
            rol = db.query(Rol).filter(Rol.id == r_data["id"]).first()
            if not rol:
                # Intenta por nombre si el ID no coincide
                rol = db.query(Rol).filter(Rol.nombre == r_data["nombre"]).first()
            
            if not rol:
                rol = Rol(
                    id=r_data["id"],
                    nombre=r_data["nombre"],
                    descripcion=r_data["descripcion"],
                    es_sistema=r_data["es_sistema"]
                )
                db.add(rol)
                db.flush()
                print(f"  [+] Rol creado: {r_data['nombre']}")
            else:
                # Actualizar información del rol existente
                rol.nombre = r_data["nombre"]
                rol.descripcion = r_data["descripcion"]
                rol.es_sistema = r_data["es_sistema"]
                print(f"  [-] Rol actualizado: {r_data['nombre']}")

        # 2. Crear todos los permisos del sistema
        print("[3/4] Configurando todos los permisos...")
        permisos_data = [
            # Configuración Global (Roles y Permisos)
            ("config.ver", "Ver Configuración", "configuracion", "Permite ver roles, permisos y configuración global"),
            ("config.editar", "Editar Configuración", "configuracion", "Permite crear y editar roles y permisos"),
            
            # Sedes
            ("sedes.ver", "Ver Sedes", "sedes", "Permite ver la lista de sedes"),
            ("sedes.crear", "Crear Sedes", "sedes", "Permite crear nuevas sedes"),
            ("sedes.editar", "Editar Sedes", "sedes", "Permite editar información de sedes"),
            
            # Usuarios
            ("usuarios.ver", "Ver Usuarios", "usuarios", "Permite ver lista de usuarios"),
            ("usuarios.crear", "Crear Usuarios", "usuarios", "Permite crear nuevos usuarios"),
            ("usuarios.editar", "Editar Usuarios", "usuarios", "Permite editar usuarios"),
            ("usuarios.eliminar", "Eliminar Usuarios", "usuarios", "Permite eliminar usuarios"),
            
            # Clientes
            ("clientes.ver", "Ver Clientes", "clientes", "Ver listado de clientes"),
            ("clientes.crear", "Crear Clientes", "clientes", "Crear nuevos clientes"),
            ("clientes.editar", "Editar Clientes", "clientes", "Editar clientes existentes"),
            ("clientes.eliminar", "Eliminar Clientes", "clientes", "Eliminar/desactivar clientes"),
            
            # Agenda / Citas
            ("agenda.ver", "Ver Agenda", "agenda", "Permite ver la agenda de citas"),
            ("agenda.crear", "Crear Citas", "agenda", "Permite agendar nuevas citas"),
            ("agenda.editar", "Editar Citas", "agenda", "Permite modificar citas"),
            ("agenda.cancelar", "Cancelar Citas", "agenda", "Permite cancelar citas"),
            
            # Especialistas
            ("especialistas.ver", "Ver Especialistas", "especialistas", "Ver lista de especialistas"),
            ("especialistas.crear", "Crear Especialistas", "especialistas", "Crear nuevos especialistas"),
            ("especialistas.editar", "Editar Especialistas", "especialistas", "Editar especialistas"),
            ("especialistas.eliminar", "Eliminar Especialistas", "especialistas", "Eliminar especialistas"),
            
            # Servicios
            ("servicios.ver", "Ver Servicios", "servicios", "Ver catálogo de servicios"),
            ("servicios.crear", "Crear Servicios", "servicios", "Crear nuevos servicios"),
            ("servicios.editar", "Editar Servicios", "servicios", "Editar servicios"),
            ("servicios.eliminar", "Eliminar Servicios", "servicios", "Eliminar servicios"),
            
            # Caja / POS
            ("caja.ver", "Ver Caja", "caja", "Ver estado de caja y facturas"),
            ("caja.apertura", "Abrir Caja", "caja", "Permite abrir la caja"),
            ("caja.cierre", "Cerrar Caja", "caja", "Permite cerrar la caja"),
            ("caja.facturar", "Crear Facturas", "caja", "Permite crear facturas de venta"),
            ("caja.anular", "Anular Facturas", "caja", "Permite anular facturas"),
            ("caja.aprobar_pendientes", "Aprobar Pendientes", "caja", "Aprobar servicios para facturación"),
            
            # Inventario
            ("inventario.ver", "Ver Inventario", "inventario", "Ver stock y productos"),
            ("inventario.crear", "Gestionar Productos", "inventario", "Crear y editar productos"),
            ("inventario.ajuste", "Ajustes de Stock", "inventario", "Realizar ajustes manuales de stock"),
            
            # Reportes y Ventas
            ("ventas.ver", "Ver Ventas", "ventas", "Ver histórico de ventas"),
            ("reportes.ver", "Ver Reportes", "reportes", "Acceso a reportes estadísticos"),
            
            # Nómina
            ("nomina.ver", "Ver Nómina", "nomina", "Consultar liquidación de nómina"),
            ("nomina.pagar", "Pagar Nómina", "nomina", "Procesar pagos de nómina"),
            
            # Abonos
            ("abonos.ver", "Ver Abonos", "abonos", "Ver abonos de clientes"),
            ("abonos.crear", "Crear Abonos", "abonos", "Registrar nuevos abonos")
        ]
        
        super_admin_rol = db.query(Rol).filter(Rol.id == 1).first()
        
        for codigo, nombre, modulo, descripcion in permisos_data:
            permiso = db.query(Permiso).filter(Permiso.codigo == codigo).first()
            if not permiso:
                permiso = Permiso(codigo=codigo, nombre=nombre, modulo=modulo, descripcion=descripcion)
                db.add(permiso)
                db.flush()
                print(f"  [+] Permiso creado: {codigo}")
            else:
                permiso.nombre = nombre
                permiso.modulo = modulo
                permiso.descripcion = descripcion
                print(f"  [-] Permiso actualizado: {codigo}")
            
            # Asignar al Super Administrador (Rol 1)
            if super_admin_rol and permiso not in super_admin_rol.permisos:
                super_admin_rol.permisos.append(permiso)
                print(f"    [->] Asignado a Super Admin")

        # Asegurar que el Super Admin tenga ABSOLUTAMENTE TODOS los permisos existentes
        all_permisos = db.query(Permiso).all()
        for p in all_permisos:
            if p not in super_admin_rol.permisos:
                super_admin_rol.permisos.append(p)
                print(f"    [->] Asignado permiso extra: {p.codigo}")

        # 3. Crear o Actualizar Super Admin
        print("[4/4] Configurando usuario Super Admin...")
        admin_user = db.query(Usuario).filter(Usuario.username == "admin").first()
        if not admin_user:
            admin_user = Usuario(
                username="admin",
                email="admin@clubalisados.com",
                password_hash=PasswordService.hash_password("Admin123!@#"),
                nombre="Administrador Global",
                rol_id=1,
                sede_id=None,
                estado="activo",
                primer_acceso=False
            )
            db.add(admin_user)
            print(f"  [+] Usuario 'admin' creado.")
        else:
            admin_user.rol_id = 1
            admin_user.sede_id = None
            print(f"  [*] Usuario 'admin' actualizado como Super Admin global.")

        db.commit()
        print("\n" + "="*60)
        print("  SISTEMA INICIALIZADO Y PERMISOS REPARADOS")
        print("="*60)
        print("\nPrueba ingresar de nuevo ahora. El usuario 'admin' ya tiene")
        print("acceso total a Roles, Permisos, Sedes y demás módulos.")
        print("="*60 + "\n")

    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    init_system()
