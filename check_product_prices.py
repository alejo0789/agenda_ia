import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from dotenv import load_dotenv

# Load .env from backend directory
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
load_dotenv(os.path.join(backend_dir, '.env'))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.producto import Producto

def check_prices():
    engine = create_engine(str(settings.database_url))
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        productos = db.execute(select(Producto)).scalars().all()
        print(f"Total products: {len(productos)}")
        print("-" * 50)
        print(f"{'ID':<5} {'Name':<30} {'P. Venta':<15} {'P. Colab':<15}")
        print("-" * 50)
        for p in productos:
            p_colab = p.precio_colaborador if p.precio_colaborador is not None else "NULL"
            print(f"{p.id:<5} {p.nombre[:28]:<30} {p.precio_venta:<15} {p_colab:<15}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_prices()
