
import os
import sys
import pandas as pd
import unicodedata
import re

# Set dummy env vars for Pydantic
os.environ['DATABASE_URL'] = "sqlite:///./dummy.db"
os.environ['SECRET_KEY'] = "dummy"
os.environ['ALGORITHM'] = "HS256"
os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'] = "30"

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.producto import Producto, Inventario, MovimientoInventario

PROD_DATABASE_URL = "postgresql://postgres:LfDDooXlptZClDMMHmyIHjjdnthSWTqz@crossover.proxy.rlwy.net:50039/railway"

def normalize_text(text):
    if not text or pd.isna(text):
        return ""
    # Convertir a minúsculas y quitar acentos
    text = "".join(
        c for c in unicodedata.normalize("NFD", str(text).lower())
        if unicodedata.category(c) != "Mn"
    )
    # Separar números de letras (ej: 60ml -> 60 ml) para mejor coincidencia
    text = re.sub(r'(\d+)([a-zA-Z]+)', r'\1 \2', text)
    text = re.sub(r'([a-zA-Z]+)(\d+)', r'\1 \2', text)
    
    # Quitar caracteres no alfanuméricos y separar palabras
    words = re.findall(r'\w+', text)
    # Sort words alphabetically
    return " ".join(sorted(words))

def import_inventory():
    print("Iniciando importacion de inventario...")
    
    # Cargar Excel
    excel_path = r'C:\Users\alejandro.carvajal\Documents\large\software\Inventario 374.xlsx'
    try:
        df = pd.read_excel(excel_path)
        print(f"Excel cargado: {len(df)} filas.")
    except Exception as e:
        print(f"Error al cargar Excel: {e}")
        return

    # Conectar a Producción
    engine = create_engine(PROD_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Obtener todos los productos de la DB
        prods_db = session.query(Producto).all()
        db_map = {normalize_text(p.nombre): p for p in prods_db}
        print(f"DB Productos cargados: {len(prods_db)} para busqueda.")

        count_updated = 0
        count_missed = 0
        missed_names = []

        for _, row in df.iterrows():
            orig_name = str(row['Producto']).strip()
            norm_name = normalize_text(orig_name)
            
            # Usar 'Stock Esperado' como cantidad si 'Stock' está vacío
            cantidad_excel = row['Stock']
            if pd.isna(cantidad_excel):
                cantidad_excel = row['Stock Esperado']
            
            if pd.isna(cantidad_excel):
                cantidad_excel = 0
            
            # Cantidad final (asegurar que no sea negativa para evitar errores de constraint)
            qty = max(0, int(cantidad_excel))

            if norm_name in db_map:
                prod = db_map[norm_name]
                
                # 1. Actualizar Stock Actual en Producto
                prod.stock_actual = qty
                
                # 2. Actualizar o Crear entrada en tabla 'Inventario' (Bodega Cali Id=1)
                inv = session.query(Inventario).filter_by(producto_id=prod.id, ubicacion_id=1).first()
                if inv:
                    inv.cantidad = qty
                else:
                    inv = Inventario(producto_id=prod.id, ubicacion_id=1, cantidad=qty)
                    session.add(inv)
                
                # 3. Registrar Movimiento si la cantidad es mayor a 0 para cumplir con la constraint
                if qty > 0:
                    mov = MovimientoInventario(
                        producto_id=prod.id,
                        tipo_movimiento='ajuste_positivo',
                        cantidad=qty,
                        ubicacion_destino_id=1,
                        motivo='Importacion inicial desde Excel Inventario 374',
                        usuario_id=1
                    )
                    session.add(mov)
                
                print(f"[MATCH] {orig_name} -> {prod.nombre} (Stock: {qty})")
                count_updated += 1
            else:
                print(f"[MISS] {orig_name}")
                count_missed += 1
                missed_names.append(orig_name)

        # Confirmacion de commit
        if count_updated > 0:
            print(f"\nGuardando cambios en produccion ({count_updated} actualizados)...")
            session.commit()
            print("Importacion finalizada con exito!")
        else:
            print("\nNo se encontraron coincidencias para actualizar.")

        if count_missed > 0:
            print(f"\nProductos NO encontradas en DB ({count_missed}):")
            for name in missed_names[:10]:
                print(f"  - {name}")
            if count_missed > 10:
                print(f"  ... y {count_missed - 10} mas.")

    except Exception as e:
        print(f"Error durante la importacion: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    import_inventory()
