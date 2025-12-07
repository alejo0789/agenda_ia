# Script temporal para crear las tablas de clientes
import sys
sys.path.append('.')

from app.database import engine, Base
from app.models.cliente import Cliente, ClientePreferencia, ClienteEtiqueta, ClienteEtiquetaAsignacion

# Crear las tablas si no existen
Base.metadata.create_all(bind=engine)
print("Tables created/verified successfully!")

# Verificar que las tablas existen
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\nExisting tables: {tables}")

# Verificar tablas de clientes específicamente
cliente_tables = ['clientes', 'cliente_preferencias', 'cliente_etiquetas', 'cliente_etiqueta_asignacion']
for table in cliente_tables:
    if table in tables:
        print(f"  ✓ {table}")
    else:
        print(f"  ✗ {table} - MISSING!")
