# Script para verificar y crear tablas de clientes
import sys
sys.path.append('.')

from app.database import engine, Base
from sqlalchemy import inspect, text

# Verificar tablas existentes
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tablas existentes: {tables}")

# Verificar tablas de clientes
cliente_tables = ['clientes', 'cliente_preferencias', 'cliente_etiquetas', 'cliente_etiqueta_asignacion']
print("\n=== Verificando tablas de clientes ===")
for table in cliente_tables:
    if table in tables:
        columns = inspector.get_columns(table)
        print(f"\n✓ {table}:")
        for col in columns:
            print(f"   - {col['name']}: {col['type']}")
    else:
        print(f"\n✗ {table} - NO EXISTE")

# Crear tablas que faltan
print("\n=== Creando tablas faltantes ===")
from app.models import cliente
Base.metadata.create_all(bind=engine)
print("Tablas creadas/actualizadas")

# Verificar nuevamente
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\nTablas después de create_all: {tables}")

# Probar consulta de etiquetas
print("\n=== Probando consulta de etiquetas ===")
from app.database import SessionLocal
from app.models.cliente import ClienteEtiqueta

db = SessionLocal()
try:
    etiquetas = db.query(ClienteEtiqueta).all()
    print(f"Etiquetas encontradas: {len(etiquetas)}")
    for e in etiquetas:
        print(f"  - {e.id}: {e.nombre} ({e.color})")
except Exception as ex:
    print(f"Error al consultar etiquetas: {ex}")
finally:
    db.close()
