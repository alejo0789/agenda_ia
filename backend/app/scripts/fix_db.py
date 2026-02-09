import sys
import os

# Añadir el directorio raíz del proyecto al path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text, inspect
from app.database import engine, SessionLocal
from app.models.sede import Sede
from app.models.auth import Rol, Permiso
from app.models.caja import MetodoPago

def fix_database():
    print("Iniciando reparación de la base de datos...")
    
    db = SessionLocal()
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    try:
        # 1. Asegurar tabla Sedes
        if 'sedes' not in tables:
            print("Creando tabla sedes...")
            Sede.__table__.create(engine)
            tables.append('sedes')
        
        # Helper para agregar columnas
        def add_column_if_missing(table_name, column_name, column_type):
            columns = [c['name'] for c in inspector.get_columns(table_name)]
            if column_name not in columns:
                print(f"Agregando columna {column_name} a {table_name}...")
                try:
                    db.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"))
                except Exception as e:
                    print(f"Aviso: No se pudo agregar {column_name} a {table_name} (quizás ya existe): {e}")

        # 2. Corregir tablas principales con sede_id y otras columnas faltantes
        tables_to_fix = {
            'usuarios': [
                ('sede_id', 'INTEGER REFERENCES sedes(id)'),
                ('primer_acceso', 'BOOLEAN DEFAULT TRUE'),
                ('requiere_cambio_password', 'BOOLEAN DEFAULT FALSE')
            ],
            'especialistas': [
                ('sede_id', 'INTEGER REFERENCES sedes(id)'),
                ('documentacion', 'TEXT')
            ],
            'clientes': [
                ('sede_id', 'INTEGER REFERENCES sedes(id)'),
                ('cedula', 'VARCHAR(20)')
            ],
            'servicios': [
                ('sede_id', 'INTEGER REFERENCES sedes(id)'),
                ('tipo_comision', "VARCHAR(20) DEFAULT 'porcentaje'"),
                ('valor_comision', 'DECIMAL(12, 2) DEFAULT 40')
            ],
            'categorias_servicio': [
                ('sede_id', 'INTEGER REFERENCES sedes(id)')
            ],
            'facturas': [
                ('sede_id', 'INTEGER REFERENCES sedes(id)')
            ],
            'cajas': [
                ('sede_id', 'INTEGER REFERENCES sedes(id)')
            ],
            'facturas_pendientes': [
                ('sede_id', 'INTEGER REFERENCES sedes(id)'),
                ('tipo', "VARCHAR(20) DEFAULT 'servicio'"),
                ('producto_id', 'INTEGER REFERENCES productos(id)')
            ],
            'productos': [
                ('sede_id', 'INTEGER REFERENCES sedes(id)')
            ],
            'roles': [
                ('sede_id', 'INTEGER REFERENCES sedes(id)')
            ]
        }

        for table, cols in tables_to_fix.items():
            if table in tables:
                for col_name, col_type in cols:
                    add_column_if_missing(table, col_name, col_type)

        # 3. Asegurar que existe al menos una sede
        db.commit() # Asegurar cambios previos
        sede_count = db.query(Sede).count()
        if sede_count == 0:
            print("Creando sede principal...")
            sede_principal = Sede(
                codigo="PRINCIPAL",
                nombre="Sede Principal",
                direccion="Calle Principal #123",
                es_principal=True,
                estado="activa"
            )
            db.add(sede_principal)
            db.commit()
            sede_id = sede_principal.id
        else:
            sede_principal = db.query(Sede).filter(Sede.es_principal == True).first()
            if not sede_principal:
                sede_principal = db.query(Sede).first()
            sede_id = sede_principal.id
            
        # 4. Asignar sede a registros existentes que no la tengan
        print(f"Asignando sede_id={sede_id} a registros huérfanos...")
        for table in tables_to_fix.keys():
            if table in tables:
                db.execute(text(f"UPDATE {table} SET sede_id = {sede_id} WHERE sede_id IS NULL"))
        
        # 5. Seed Métodos de Pago
        if 'metodos_pago' in tables:
            metodos_count = db.query(MetodoPago).count()
            if metodos_count == 0:
                print("Sembrando métodos de pago...")
                metodos = [
                    MetodoPago(nombre='Efectivo', activo=True, requiere_referencia=False),
                    MetodoPago(nombre='Tarjeta Débito', activo=True, requiere_referencia=True),
                    MetodoPago(nombre='Tarjeta Crédito', activo=True, requiere_referencia=True),
                    MetodoPago(nombre='Nequi', activo=True, requiere_referencia=True),
                    MetodoPago(nombre='Daviplata', activo=True, requiere_referencia=True),
                    MetodoPago(nombre='Transferencia', activo=True, requiere_referencia=True),
                ]
                db.add_all(metodos)
        
        # 6. Seed Roles iniciales
        if 'roles' in tables:
            rol_count = db.query(Rol).count()
            if rol_count == 0:
                print("Sembrando roles...")
                roles = [
                    Rol(nombre='Administrador', descripcion='Acceso total'),
                    Rol(nombre='Especialista', descripcion='Acceso limitado especialistas'),
                    Rol(nombre='Cajero', descripcion='Acceso a caja'),
                ]
                db.add_all(roles)
            
        db.commit()
        print("Base de datos reparada e inicializada correctamente.")
        
    except Exception as e:
        db.rollback()
        print(f"Error reparando base de datos: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    fix_database()
