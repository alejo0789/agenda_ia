
import os
import sys

# Set dummy env vars for Pydantic
os.environ['DATABASE_URL'] = "sqlite:///./dummy.db"
os.environ['SECRET_KEY'] = "dummy"
os.environ['ALGORITHM'] = "HS256"
os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'] = "30"

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.producto import Producto, UbicacionInventario

PROD_DATABASE_URL = "postgresql://postgres:LfDDooXlptZClDMMHmyIHjjdnthSWTqz@crossover.proxy.rlwy.net:50039/railway"

def check_prod():
    print("Conectando a producción...")
    engine = create_engine(PROD_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        prods = session.query(Producto).all()
        print(f"Total productos en Prod: {len(prods)}")
        for p in prods[:10]:
            print(f"- {p.nombre} (Stock: {p.stock_actual})")
            
        locs = session.query(UbicacionInventario).all()
        print(f"\nUbicaciones en Prod: {len(locs)}")
        for l in locs:
            print(f"- {l.id}: {l.nombre} (Sede: {l.sede_id})")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    check_prod()
