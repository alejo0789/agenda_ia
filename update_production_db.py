import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path to import models
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set dummy env vars to satisfy Pydantic Settings validation
os.environ['DATABASE_URL'] = "sqlite:///./dummy.db"
os.environ['SECRET_KEY'] = "dummy"
os.environ['ALGORITHM'] = "HS256"
os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'] = "30"

from app.models.descuento import Descuento
from app.models.caja import DetalleFactura
from app.models.cliente import Cliente
from app.models import Permiso, Rol

# Production DB URL provided by user
PROD_DATABASE_URL = "postgresql://postgres:LfDDooXlptZClDMMHmyIHjjdnthSWTqz@crossover.proxy.rlwy.net:50039/railway"

def update_production_db():
    print(f"Conectando a base de datos de producción...")
    engine = create_engine(PROD_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # 1. Crear tabla descuentos
        print("1. Creando tabla 'descuentos'...")
        try:
            Descuento.__table__.create(bind=engine)
            print("   Tabla 'descuentos' creada.")
        except Exception as e:
            print(f"   Tabla 'descuentos' ya existe o error: {e}")

        # 2. Migrar columnas (Schema changes)
        print("2. Ejecutando migraciones de esquema...")
        with engine.connect() as conn:
            # Clientes: es_colaborador
            try:
                conn.execute(text("ALTER TABLE clientes ADD COLUMN es_colaborador BOOLEAN DEFAULT FALSE"))
                print("   Columna 'es_colaborador' agregada a clientes.")
            except Exception as e:
                print(f"   Nota: {e}")

            # Detalle Factura: descuento_id, precio_colaborador_aplicado, etc.
            try:
                conn.execute(text("ALTER TABLE detalle_factura ADD COLUMN descuento_id INTEGER REFERENCES descuentos(id)"))
                print("   Columna 'descuento_id' agregada.")
            except Exception as e:
                print(f"   Nota: {e}")
            
            try:
                conn.execute(text("ALTER TABLE detalle_factura ADD COLUMN precio_colaborador_aplicado BOOLEAN DEFAULT FALSE"))
                print("   Columna 'precio_colaborador_aplicado' agregada.")
            except Exception as e:
                print(f"   Nota: {e}")

            try:
                conn.execute(text("ALTER TABLE detalle_factura ADD COLUMN tipo_descuento VARCHAR(20)"))
                print("   Columna 'tipo_descuento' agregada.")
            except Exception as e:
                print(f"   Nota: {e}")

            try:
                conn.execute(text("ALTER TABLE detalle_factura ADD COLUMN valor_descuento_aplicado NUMERIC(10, 2)"))
                print("   Columna 'valor_descuento_aplicado' agregada.")
            except Exception as e:
                print(f"   Nota: {e}")
            
            conn.commit()

        # 3. Agregar Permisos
        print("3. Agregando nuevos permisos...")
        permisos_data = [
            {"codigo": "descuentos.ver", "nombre": "Ver Descuentos", "descripcion": "Permite ver la lista de descuentos y bonos", "modulo": "Descuentos"},
            {"codigo": "descuentos.crear", "nombre": "Crear Descuentos", "descripcion": "Permite crear nuevos descuentos y bonos", "modulo": "Descuentos"},
            {"codigo": "descuentos.editar", "nombre": "Editar Descuentos", "descripcion": "Permite editar descuentos existentes", "modulo": "Descuentos"},
            {"codigo": "descuentos.eliminar", "nombre": "Eliminar Descuentos", "descripcion": "Permite eliminar descuentos", "modulo": "Descuentos"},
        ]

        for p_data in permisos_data:
            permiso = session.query(Permiso).filter(Permiso.codigo == p_data["codigo"]).first()
            if not permiso:
                permiso = Permiso(**p_data)
                session.add(permiso)
                print(f"   Permiso creado: {p_data['codigo']}")
            else:
                print(f"   Permiso ya existe: {p_data['codigo']}")
        
        session.commit()

        # 4. Asignar permisos a Admin
        print("4. Asignando permisos a Administrador...")
        rol_admin = session.query(Rol).filter(Rol.nombre == "Administrador").first()
        if rol_admin:
            permisos = session.query(Permiso).filter(Permiso.codigo.like("descuentos.%")).all()
            count = 0
            for p in permisos:
                if p not in rol_admin.permisos:
                    rol_admin.permisos.append(p)
                    count += 1
            if count > 0:
                print(f"   {count} permisos asignados a Administrador.")
                session.commit()
            else:
                print("   Administrador ya tiene los permisos.")
        else:
            print("   Rol Administrador no encontrado.")

    except Exception as e:
        print(f"ERROR GENERAL: {e}")
        session.rollback()
    finally:
        session.close()
        print("Proceso finalizado.")

if __name__ == "__main__":
    update_production_db()
