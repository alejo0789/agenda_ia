
import os
import sys
import pandas as pd
import unicodedata
import re
import uuid

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
    text = "".join(
        c for c in unicodedata.normalize("NFD", str(text).lower())
        if unicodedata.category(c) != "Mn"
    )
    text = re.sub(r'(\d+)([a-zA-Z]+)', r'\1 \2', text)
    text = re.sub(r'([a-zA-Z]+)(\d+)', r'\1 \2', text)
    words = re.findall(r'\w+', text)
    return " ".join(sorted(words))

def create_and_import():
    print("Iniciando creacion e importacion masiva...")
    
    excel_path = r'C:\Users\alejandro.carvajal\Documents\large\software\Inventario 374.xlsx'
    try:
        df = pd.read_excel(excel_path)
        print(f"Excel cargado: {len(df)} filas.")
    except Exception as e:
        print(f"Error al cargar Excel: {e}")
        return

    engine = create_engine(PROD_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Obtener todos los productos de la DB
        prods_db = session.query(Producto).all()
        db_map = {normalize_text(p.nombre): p for p in prods_db}
        print(f"DB Productos existentes: {len(prods_db)}.")

        # Obtener todos los códigos existentes para evitar duplicados
        codigos_existentes = set(p.codigo for p in prods_db if p.codigo)

        count_updated = 0
        count_created = 0

        for _, row in df.iterrows():
            orig_name = str(row['Producto']).strip()
            norm_name = normalize_text(orig_name)
            
            cantidad_excel = row['Stock']
            if pd.isna(cantidad_excel):
                cantidad_excel = row['Stock Esperado']
            
            qty = max(0, int(cantidad_excel) if not pd.isna(cantidad_excel) else 0)

            if norm_name in db_map:
                prod = db_map[norm_name]
                prod.stock_actual = qty
                count_updated += 1
                action = "MATCH"
            else:
                # Crear nuevo producto
                # Generar código único
                short_slug = norm_name[:10].replace(" ", "-")
                base_codigo = f"IMP-{short_slug}-{uuid.uuid4().hex[:4]}".upper()
                
                prod = Producto(
                    nombre=orig_name,
                    codigo=base_codigo,
                    precio_venta=0,
                    sede_id=1,
                    stock_actual=qty,
                    unidad_medida='unidad',
                    estado='activo'
                )
                session.add(prod)
                session.flush() # Para obtener prod.id
                count_created += 1
                action = "CREATE"
            
            # Actualizar o Crear entrada en tabla 'Inventario' (Bodega Cali Id=1)
            inv = session.query(Inventario).filter_by(producto_id=prod.id, ubicacion_id=1).first()
            if inv:
                inv.cantidad = qty
            else:
                inv = Inventario(producto_id=prod.id, ubicacion_id=1, cantidad=qty)
                session.add(inv)
                
            # Registrar Movimiento si qty > 0
            if qty > 0:
                mov = MovimientoInventario(
                    producto_id=prod.id,
                    tipo_movimiento='ajuste_positivo',
                    cantidad=qty,
                    ubicacion_destino_id=1,
                    motivo=f'Importacion desde Excel ({action})',
                    usuario_id=1
                )
                session.add(mov)
                
            print(f"[{action}] {orig_name} (Stock: {qty})")

        print(f"\nFinalizado: {count_updated} actualizados, {count_created} creados.")
        print("Guardando cambios en produccion...")
        session.commit()
        print("Exito total!")

    except Exception as e:
        print(f"Error critico: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    create_and_import()
