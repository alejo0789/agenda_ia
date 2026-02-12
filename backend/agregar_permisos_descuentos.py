from app.database import SessionLocal
from app.models import Permiso, Rol
import sys

def agregar_permisos():
    db = SessionLocal()
    try:
        # Definir nuevos permisos
        permisos_data = [
            {"codigo": "descuentos.ver", "nombre": "Ver Descuentos", "descripcion": "Permite ver la lista de descuentos y bonos", "modulo": "Descuentos"},
            {"codigo": "descuentos.crear", "nombre": "Crear Descuentos", "descripcion": "Permite crear nuevos descuentos y bonos", "modulo": "Descuentos"},
            {"codigo": "descuentos.editar", "nombre": "Editar Descuentos", "descripcion": "Permite editar descuentos existentes", "modulo": "Descuentos"},
            {"codigo": "descuentos.eliminar", "nombre": "Eliminar Descuentos", "descripcion": "Permite eliminar descuentos", "modulo": "Descuentos"},
        ]

        # Crear permisos si no existen
        for p_data in permisos_data:
            permiso = db.query(Permiso).filter(Permiso.codigo == p_data["codigo"]).first()
            if not permiso:
                permiso = Permiso(**p_data)
                db.add(permiso)
                print(f"Permiso creado: {p_data['codigo']}")
            else:
                print(f"Permiso ya existe: {p_data['codigo']}")
        
        db.commit()

        # Asignar permisos al rol Administrador
        rol_admin = db.query(Rol).filter(Rol.nombre == "Administrador").first()
        if rol_admin:
            print(f"Asignando permisos al rol: {rol_admin.nombre}")
            permisos = db.query(Permiso).filter(Permiso.codigo.like("descuentos.%")).all()
            for p in permisos:
                if p not in rol_admin.permisos:
                    rol_admin.permisos.append(p)
                    print(f"Permiso {p.codigo} asignado")
            
            db.commit()
        else:
            print("Rol Administrador no encontrado")
            
        # Asignar permiso de ver al rol Cajero (si existe) y Especialista (opcional)
        # El user story dice que cajeros pueden aplicar descuentos. 
        # Asumimos que ver activos no requiere permiso explicito en el endpoint (auth required)
        # o que usaremos 'descuentos.ver' para listar.
        # Vamos a darle 'descuentos.ver' al Cajero por si acaso.
        """
        rol_cajero = db.query(Rol).filter(Rol.nombre == "Cajero").first()
        if rol_cajero:
             permiso_ver = db.query(Permiso).filter(Permiso.codigo == "descuentos.ver").first()
             if permiso_ver and permiso_ver not in rol_cajero.permisos:
                 rol_cajero.permisos.append(permiso_ver)
                 db.commit()
        """

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    agregar_permisos()
