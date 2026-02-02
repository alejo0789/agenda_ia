"""
Script para agregar permisos de productos e inventario al sistema
y asignarlos al rol admin.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Rol, Permiso, RolPermiso

def main():
    db = SessionLocal()
    
    try:
        # Permisos a agregar para el modulo de productos e inventario
        permisos_productos = [
            # Productos
            ("productos.ver", "Ver catalogo de productos"),
            ("productos.crear", "Crear nuevos productos"),
            ("productos.editar", "Editar productos existentes"),
            ("productos.eliminar", "Eliminar productos"),
            # Inventario
            ("inventario.ver", "Ver inventario y movimientos"),
            ("inventario.crear", "Registrar movimientos de inventario"),
            ("inventario.editar", "Editar movimientos de inventario"),
            ("inventario.eliminar", "Eliminar movimientos de inventario"),
            ("inventario.ajustar", "Realizar ajustes de inventario"),
            ("inventario.transferir", "Realizar transferencias entre ubicaciones"),
            ("inventario.conteo", "Realizar conteos fisicos"),
            ("inventario.movimiento", "Registrar movimientos manuales"),
            ("inventario.configurar", "Configurar ubicaciones de inventario"),
            ("inventario.comprar", "Registrar compras de inventario"),
            ("inventario.anular", "Anular movimientos de inventario"),
            # Reportes de inventario
            ("inventario.reportes", "Ver reportes de inventario"),
            ("reportes.ver", "Ver reportes del sistema"),
        ]
        
        # Agregar permisos que no existan
        permisos_agregados = []
        for codigo, descripcion in permisos_productos:
            permiso_existente = db.query(Permiso).filter(Permiso.codigo == codigo).first()
            if not permiso_existente:
                nuevo_permiso = Permiso(
                    codigo=codigo,
                    nombre=descripcion,
                    modulo=codigo.split('.')[0]  # Extraer el modulo del codigo
                )
                db.add(nuevo_permiso)
                permisos_agregados.append(codigo)
                print(f"[+] Permiso agregado: {codigo}")
            else:
                print(f"[=] Permiso ya existe: {codigo}")
        
        db.commit()
        
        # Obtener el rol admin
        rol_admin = db.query(Rol).filter(Rol.nombre == "Administrador").first()
        
        if not rol_admin:
            print("[X] No se encontro el rol 'Administrador'")
            return
        
        print(f"\n[*] Asignando permisos al rol: {rol_admin.nombre} (ID: {rol_admin.id})")
        
        # Asignar todos los permisos de productos e inventario al rol admin
        permisos_asignados = []
        for codigo, _ in permisos_productos:
            permiso = db.query(Permiso).filter(Permiso.codigo == codigo).first()
            if permiso:
                # Verificar si ya esta asignado
                existe_asignacion = db.query(RolPermiso).filter(
                    RolPermiso.rol_id == rol_admin.id,
                    RolPermiso.permiso_id == permiso.id
                ).first()
                
                if not existe_asignacion:
                    rol_permiso = RolPermiso(rol_id=rol_admin.id, permiso_id=permiso.id)
                    db.add(rol_permiso)
                    permisos_asignados.append(codigo)
                    print(f"[+] Permiso asignado: {codigo}")
                else:
                    print(f"[=] Permiso ya asignado: {codigo}")
        
        db.commit()
        
        print(f"\n[OK] Proceso completado!")
        print(f"     - Permisos agregados: {len(permisos_agregados)}")
        print(f"     - Permisos asignados al admin: {len(permisos_asignados)}")
        
    except Exception as e:
        db.rollback()
        print(f"[X] Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
