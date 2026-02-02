
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
    print("  INICIALIZANDO SISTEMA - VERSIÓN OPTIMIZADA PARA RAILWAY")
    print("="*60 + "\n")

    # Asegurar que las tablas existan
    print("[1/4] Verificando tablas...")
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
                rol = Rol(id=r_data["id"], nombre=r_data["nombre"], descripcion=r_data["descripcion"], es_sistema=True)
                db.add(rol)
                db.flush()
                print(f"  [+] Creado: {r_data['nombre']}")
            else:
                print(f"  [-] Existe: {r_data['nombre']}")
            roles_map[r_data["nombre"]] = rol

        db.commit() # Guardar roles primero

        # 2. LIMPIEZA RÁPIDA DE PERMISOS
        print("[3/4] Sincronizando permisos (Limpieza rápida)...")
        db.execute(text("DELETE FROM rol_permisos"))
        db.commit()

        # Lista de todos los permisos necesarios
        permisos_data = [
            ("config.ver", "Ver Configuración", "configuracion"),
            ("config.editar", "Editar Configuración", "configuracion"),
            ("roles.ver", "Ver Roles", "roles"),
            ("usuarios.ver", "Ver Usuarios", "usuarios"),
            ("usuarios.crear", "Crear Usuarios", "usuarios"),
            ("usuarios.editar", "Editar Usuarios", "usuarios"),
            ("usuarios.eliminar", "Eliminar Usuarios", "usuarios"),
            ("sedes.ver", "Ver Sedes", "sedes"),
            ("sedes.crear", "Crear Sedes", "sedes"),
            ("sedes.editar", "Editar Sedes", "sedes"),
            ("especialistas.ver", "Ver especialistas", "especialistas"),
            ("especialistas.crear", "Crear especialistas", "especialistas"),
            ("especialistas.editar", "Editar especialistas", "especialistas"),
            ("especialistas.eliminar", "Eliminar especialistas", "especialistas"),
            ("servicios.ver", "Ver servicios", "servicios"),
            ("servicios.crear", "Crear servicios", "servicios"),
            ("servicios.editar", "Editar servicios", "servicios"),
            ("servicios.eliminar", "Eliminar servicios", "servicios"),
            ("agenda.ver", "Ver agenda", "agenda"),
            ("agenda.crear", "Crear Citas", "agenda"),
            ("agenda.editar", "Editar Citas", "agenda"),
            ("agenda.cancelar", "Cancelar Citas", "agenda"),
            ("agenda.eliminar", "Eliminar Citas", "agenda"),
            ("clientes.ver", "Ver clientes", "clientes"),
            ("clientes.crear", "Crear clientes", "clientes"),
            ("clientes.editar", "Editar clientes", "clientes"),
            ("clientes.eliminar", "Eliminar clientes", "clientes"),
            ("clientes.buscar", "Buscar Clientes", "clientes"),
            ("caja.ver", "Ver caja", "caja"),
            ("caja.facturar", "Facturar", "caja"),
            ("caja.anular", "Anular Facturas", "caja"),
            ("caja.apertura", "Apertura de Caja", "caja"),
            ("caja.cierre", "Cierre de Caja", "caja"),
            ("caja.crear_orden", "Crear Orden Pendiente", "caja"),
            ("caja.aprobar_pendientes", "Aprobar Pendientes", "caja"),
            ("facturas.editar", "Editar Facturas", "facturas"),
            ("inventario.ver", "Ver stock", "inventario"),
            ("inventario.crear", "Crear Item Inventario", "inventario"),
            ("inventario.editar", "Editar Item Inventario", "inventario"),
            ("inventario.ajustar", "Ajustar Stock", "inventario"),
            ("inventario.conteo", "Realizar Conteo", "inventario"),
            ("inventario.exportar", "Exportar Inventario", "inventario"),
            ("inventario.transferir", "Transferir Stock", "inventario"),
            ("inventario.reportes", "Reportes Inventario", "inventario"),
            ("inventario.movimiento", "Ver Movimientos", "inventario"),
            ("inventario.configurar", "Configurar Inventario", "inventario"),
            ("inventario.comprar", "Registrar Compras", "inventario"),
            ("inventario.anular", "Anular Movimientos", "inventario"),
            ("inventario.eliminar", "Eliminar del Inventario", "inventario"),
            ("productos.ver", "Ver productos", "productos"),
            ("productos.crear", "Crear productos", "productos"),
            ("productos.editar", "Editar productos", "productos"),
            ("productos.eliminar", "Eliminar productos", "productos"),
            ("abonos.ver", "Ver Abonos", "abonos"),
            ("abonos.crear", "Crear Abonos", "abonos"),
            ("abonos.anular", "Anular Abonos", "abonos"),
            ("nomina.ver", "Ver Nómina", "nomina"),
            ("nomina.calcular", "Calcular Nómina", "nomina"),
            ("nomina.pagar", "Pagar Nómina", "nomina"),
            ("reportes.ver", "Ver Reportes", "reportes"),
            ("reportes.exportar", "Exportar Reportes", "reportes"),
        ]

        # Mappings Exactos
        especialista_p = ['especialistas.ver', 'servicios.ver', 'agenda.ver', 'caja.ver', 'inventario.ver', 'productos.ver', 'abonos.ver', 'abonos.crear', 'abonos.anular', 'clientes.buscar', 'caja.crear_orden', 'nomina.ver']
        cajero_p = ['especialistas.ver', 'especialistas.crear', 'especialistas.editar', 'agenda.ver', 'agenda.crear', 'agenda.editar', 'agenda.cancelar', 'clientes.crear', 'clientes.editar', 'caja.ver', 'caja.facturar', 'caja.anular', 'caja.apertura', 'caja.cierre', 'caja.aprobar_pendientes', 'inventario.ver', 'inventario.crear', 'inventario.editar', 'inventario.ajustar', 'agenda.eliminar', 'productos.ver', 'inventario.conteo', 'abonos.ver', 'abonos.crear', 'abonos.anular', 'clientes.buscar']
        recepcionista_p = ['abonos.ver', 'abonos.crear', 'abonos.anular', 'clientes.buscar']
        admin_p = ['clientes.buscar', 'agenda.ver', 'caja.crear_orden', 'sedes.ver', 'sedes.crear', 'sedes.editar', 'roles.ver', 'especialistas.ver', 'especialistas.crear', 'especialistas.editar', 'especialistas.eliminar', 'servicios.ver', 'servicios.crear', 'servicios.editar', 'servicios.eliminar', 'agenda.crear', 'agenda.editar', 'agenda.cancelar', 'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.eliminar', 'caja.ver', 'caja.facturar', 'caja.anular', 'caja.apertura', 'caja.cierre', 'caja.aprobar_pendientes', 'inventario.ver', 'inventario.crear', 'inventario.editar', 'inventario.ajustar', 'inventario.exportar', 'reportes.ver', 'reportes.exportar', 'nomina.ver', 'nomina.calcular', 'nomina.pagar', 'config.ver', 'config.editar', 'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar', 'agenda.eliminar', 'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar', 'inventario.eliminar', 'inventario.transferir', 'inventario.conteo', 'inventario.reportes', 'inventario.movimiento', 'inventario.configurar', 'inventario.comprar', 'inventario.anular', 'abonos.ver', 'abonos.crear', 'abonos.anular', 'facturas.editar']

        print(f"Asignando {len(permisos_data)} permisos...")
        for cod, nom, mod in permisos_data:
            perm = db.query(Permiso).filter(Permiso.codigo == cod).first()
            if not perm:
                perm = Permiso(codigo=cod, nombre=nom, modulo=mod)
                db.add(perm)
                db.flush()
            
            # Super Admin
            roles_map["Super Administrador"].permisos.append(perm)
            # Otros roles
            if cod in especialista_p: roles_map["Especialista"].permisos.append(perm)
            if cod in cajero_p: roles_map["Cajero"].permisos.append(perm)
            if cod in recepcionista_p: roles_map["Recepcionista"].permisos.append(perm)
            if cod in admin_p: roles_map["Administrador"].permisos.append(perm)
            
            print(".", end="", flush=True)

        # 3. Super Admin User
        print("\n[4/4] Verificando admin...")
        admin = db.query(Usuario).filter(Usuario.username == "admin").first()
        if not admin:
            admin = Usuario(username="admin", email="admin@clubalisados.com", password_hash=PasswordService.hash_password("Admin123!@#"), nombre="Admin Global", rol_id=roles_map["Super Administrador"].id, estado="activo")
            db.add(admin)
        else:
            admin.rol_id = roles_map["Super Administrador"].id
        
        db.commit()
        print("Done!")
        print("\nSISTEMA REPARADO")

    except Exception as e:
        print(f"\n[ERROR] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_system()
