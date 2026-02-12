from app.database import engine, Base
from app.models.descuento import Descuento

def crear_tablas():
    print("Creando tabla de descuentos...")
    Descuento.__table__.create(bind=engine)
    print("Tabla creada exitosamente.")

if __name__ == "__main__":
    crear_tablas()
