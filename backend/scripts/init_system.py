
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
    print("  INICIALIZANDO SISTEMA - REPLICANDO PERMISOS EXACTOS")
    print("="*60 + "\n")

    # Asegurar que las tablas existan
    print("[1/4] Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Crear Roles Básicos
        print("[2/4] Configurando roles...")
        roles_data = [
            {"id": 1, "nombre": "Super Administrador", "descripcion": "Acceso total al sistema y gestión de sedes"},
            {"id": 2, "nombre": "Administrador", "descripcion": "Administrador de sede"},
            {"id": 3, "nombre": "Cajero", "descripcion": "Gestión de caja y facturación"},
            {"id": 4, "nombre": "Recepcionista", "descripcion": "Gestión de citas y clientes"},
            {"id": 5, "nombre": "Especialista", "descripcion": "Estilista / Prestador de servicios"}
        ]
        
        roles_map = {}
        for r_data in roles_data:
            rol = db.query(Rol).filter(Rol.nombre == r_data["nombre"]).first()
            if not rol:
                rol = Rol(
                    id=r_data["id"],
                    nombre=r_data["nombre"],
                    descripcion=r_data["descripcion"],
                    es_sistema=True
                )
                db.add(rol)
                db.flush()
                print(f"  [+] Rol creado: {r_data['nombre']}")
            else:
                rol.descripcion = r_data["descripcion"]
                print(f"  [-] Rol ya existe: {r_data['nombre']}")
            # Limpiar permisos existentes para re-asignar exactamente los locales
            rol.permisos = []
            roles_map[r_data["nombre"]] = rol

        # 2. Definir Permisos (Lista expandida basada en dump local)
        print("[3/4] Configurando definiciones de permisos...")
        
        permisos_data = [
            # Configuración / Usuarios
            ("config.ver", "Ver Configuración", "configuracion", ""),
            ("config.editar", "Editar Configuración", "configuracion", ""),
            ("roles.ver", "Ver Roles", "roles", ""),
            ("usuarios.ver", "Ver Usuarios", "usuarios", ""),
            ("usuarios.crear", "Crear Usuarios", "usuarios", ""),
            ("usuarios.editar", "Editar Usuarios", "usuarios", ""),
            ("usuarios.eliminar", "Eliminar Usuarios", "usuarios", ""),
            
            # Sedes
            ("sedes.ver", "Ver Sedes", "sedes", ""),
            ("sedes.crear", "Crear Sedes", "sedes", ""),
            ("sedes.editar", "Editar Sedes", "sedes", ""),
            
            # Especialistas
            ("especialistas.ver", "Ver especialistas", "especialistas", ""),
            ("especialistas.crear", "Crear especialistas", "especialistas", ""),
            ("especialistas.editar", "Editar especialistas", "especialistas", ""),
            ("especialistas.eliminar", "Eliminar especialistas", "especialistas", ""),
            
            # Servicios
            ("servicios.ver", "Ver servicios", "servicios", ""),
            ("servicios.crear", "Crear servicios", "servicios", ""),
            ("servicios.editar", "Editar servicios", "servicios", ""),
            ("servicios.eliminar", "Eliminar servicios", "servicios", ""),
            
            # Agenda
            ("agenda.ver", "Ver agenda", "agenda", ""),
            ("agenda.crear", "Crear Citas", "agenda", ""),
            ("agenda.editar", "Editar Citas", "agenda", ""),
            ("agenda.cancelar", "Cancelar Citas", "agenda", ""),
            ("agenda.eliminar", "Eliminar Citas", "agenda", ""),
            
            # Clientes
            ("clientes.ver", "Ver clientes", "clientes", ""),
            ("clientes.crear", "Crear clientes", "clientes", ""),
            ("clientes.editar", "Editar clientes", "clientes", ""),
            ("clientes.eliminar", "Eliminar clientes", "clientes", ""),
            ("clientes.buscar", "Buscar Clientes", "clientes", ""),
            
            # Caja
            ("caja.ver", "Ver caja", "caja", ""),
            ("caja.facturar", "Facturar", "caja", ""),
            ("caja.anular", "Anular Facturas", "caja", ""),
            ("caja.apertura", "Apertura de Caja", "caja", ""),
            ("caja.cierre", "Cierre de Caja", "caja", ""),
            ("caja.crear_orden", "Crear Orden Pendiente", "caja", ""),
            ("caja.aprobar_pendientes", "Aprobar Pendientes", "caja", ""),
            ("facturas.editar", "Editar Facturas", "facturas", ""),
            
            # Inventario / Productos
            ("inventario.ver", "Ver stock", "inventario", ""),
            ("inventario.crear", "Crear Item Inventario", "inventario", ""),
            ("inventario.editar", "Editar Item Inventario", "inventario", ""),
            ("inventario.ajustar", "Ajustar Stock", "inventario", ""),
            ("inventario.conteo", "Realizar Conteo", "inventario", ""),
            ("inventario.exportar", "Exportar Inventario", "inventario", ""),
            ("inventario.transferir", "Transferir Stock", "inventario", ""),
            ("inventario.reportes", "Reportes Inventario", "inventario", ""),
            ("inventario.movimiento", "Ver Movimientos", "inventario", ""),
            ("inventario.configurar", "Configurar Inventario", "inventario", ""),
            ("inventario.comprar", "Registrar Compras", "inventario", ""),
            ("inventario.anular", "Anular Movimientos", "inventario", ""),
            ("inventario.eliminar", "Eliminar del Inventario", "inventario", ""),
            ("productos.ver", "Ver productos", "productos", ""),
            ("productos.crear", "Crear productos", "productos", ""),
            ("productos.editar", "Editar productos", "productos", ""),
            ("productos.eliminar", "Eliminar productos", "productos", ""),
            
            # Abonos
            ("abonos.ver", "Ver Abonos", "abonos", ""),
            ("abonos.crear", "Crear Abonos", "abonos", ""),
            ("abonos.anular", "Anular Abonos", "abonos", ""),
            
            # Nómina
            ("nomina.ver", "Ver Nómina", "nomina", ""),
            ("nomina.calcular", "Calcular Nómina", "nomina", ""),
            ("nomina.pagar", "Pagar Nómina", "nomina", ""),
            
            # Reportes
            ("reportes.ver", "Ver Reportes", "reportes", ""),
            ("reportes.exportar", "Exportar Reportes", "reportes", ""),
        ]

        # Mappings Exactos (Basado en el dump local real)
        especialista_perms = [
            'especialistas.ver', 'servicios.ver', 'agenda.ver', 'caja.ver', 
            'inventario.ver', 'productos.ver', 'abonos.ver', 'abonos.crear', 
            'abonos.anular', 'clientes.buscar', 'caja.crear_orden', 'nomina.ver'
        ]

        cajero_perms = [
            'especialistas.ver', 'especialistas.crear', 'especialistas.editar',
            'agenda.ver', 'agenda.crear', 'agenda.editar', 'agenda.cancelar',
            'clientes.crear', 'clientes.editar', 'caja.ver', 'caja.facturar',
            'caja.anular', 'caja.apertura', 'caja.cierre', 'caja.aprobar_pendientes',
            'inventario.ver', 'inventario.crear', 'inventario.editar', 'inventario.ajustar',
            'agenda.eliminar', 'productos.ver', 'inventario.conteo',
            'abonos.ver', 'abonos.crear', 'abonos.anular', 'clientes.buscar'
        ]

        recepcionista_perms = [
            'abonos.ver', 'abonos.crear', 'abonos.anular', 'clientes.buscar'
        ]

        # El administrador tiene casi todo segun el dump
        admin_perms = [
            'clientes.buscar', 'agenda.ver', 'caja.crear_orden', 'sedes.ver', 'sedes.crear', 'sedes.editar',
            'roles.ver', 'especialistas.ver', 'especialistas.crear', 'especialistas.editar', 'especialistas.eliminar',
            'servicios.ver', 'servicios.crear', 'servicios.editar', 'servicios.eliminar',
            'agenda.crear', 'agenda.editar', 'agenda.cancelar', 'clientes.ver', 'clientes.crear', 'clientes.editar',
            'clientes.eliminar', 'caja.ver', 'caja.facturar', 'caja.anular', 'caja.apertura', 'caja.cierre',
            'caja.aprobar_pendientes', 'inventario.ver', 'inventario.crear', 'inventario.editar', 'inventario.ajustar',
            'inventario.exportar', 'reportes.ver', 'reportes.exportar', 'nomina.ver', 'nomina.calcular', 'nomina.pagar',
            'config.ver', 'config.editar', 'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
            'agenda.eliminar', 'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
            'inventario.eliminar', 'inventario.transferir', 'inventario.conteo', 'inventario.reportes',
            'inventario.movimiento', 'inventario.configurar', 'inventario.comprar', 'inventario.anular',
            'abonos.ver', 'abonos.crear', 'abonos.anular', 'facturas.editar'
        ]

        for codigo, nombre, modulo, descripcion in permisos_data:
            permiso = db.query(Permiso).filter(Permiso.codigo == codigo).first()
            if not permiso:
                permiso = Permiso(codigo=codigo, nombre=nombre, modulo=modulo, descripcion=descripcion)
                db.add(permiso)
                db.flush()
                print(f"  [+] Permiso definido: {codigo}")
            else:
                permiso.nombre = nombre
                permiso.modulo = modulo
                print(f"  [-] Permiso ya existe: {codigo}")
            
            # Super Admin
            if roles_map["Super Administrador"] and permiso not in roles_map["Super Administrador"].permisos:
                roles_map["Super Administrador"].permisos.append(permiso)
            
            # Especialista
            if codigo in especialista_perms and permiso not in roles_map["Especialista"].permisos:
                roles_map["Especialista"].permisos.append(permiso)
            
            # Cajero
            if codigo in cajero_perms and permiso not in roles_map["Cajero"].permisos:
                roles_map["Cajero"].permisos.append(permiso)
                
            # Recepcionista
            if codigo in recepcionista_perms and permiso not in roles_map["Recepcionista"].permisos:
                roles_map["Recepcionista"].permisos.append(permiso)
                
            # Administrador local
            if codigo in admin_perms and permiso not in roles_map["Administrador"].permisos:
                roles_map["Administrador"].permisos.append(permiso)

        # 3. Super Admin User
        print("[4/4] Verificando usuario admin...")
        admin_user = db.query(Usuario).filter(Usuario.username == "admin").first()
        if not admin_user:
            admin_user = Usuario(
                username="admin",
                email="admin@clubalisados.com",
                password_hash=PasswordService.hash_password("Admin123!@#"),
                nombre="Administrador Global",
                rol_id=roles_map["Super Administrador"].id,
                sede_id=None,
                estado="activo",
                primer_acceso=False
            )
            db.add(admin_user)
            print("  [+] Usuario admin creado.")
        else:
            admin_user.rol_id = roles_map["Super Administrador"].id
            admin_user.sede_id = None
            print("  [*] Usuario admin verificado.")

        db.commit()
        print("\n" + "="*60)
        print("  SISTEMA SINCRONIZADO CON PERMISOS LOCALES (TODOS LOS ROLES)")
        print("="*60)

    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    init_system()
