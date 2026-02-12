from app.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        print("Migrando columnas...")
        
        # 1. Cliente: es_colaborador
        try:
            conn.execute(text("ALTER TABLE clientes ADD COLUMN es_colaborador BOOLEAN DEFAULT FALSE"))
            print("Columna 'es_colaborador' agregada a tabla clientes.")
        except Exception as e:
            print(f"Error o ya existe 'es_colaborador' en clientes: {e}")
        
        # 2. Detalle Factura: descuento_id, precio_colaborador_aplicado, tipo_descuento, valor_descuento_aplicado
        try:
            conn.execute(text("ALTER TABLE detalle_factura ADD COLUMN descuento_id INTEGER REFERENCES descuentos(id)"))
            print("Columna 'descuento_id' agregada a tabla detalle_factura.")
        except Exception as e:
            print(f"Error o ya existe 'descuento_id' en detalle_factura: {e}")

        try:
            conn.execute(text("ALTER TABLE detalle_factura ADD COLUMN precio_colaborador_aplicado BOOLEAN DEFAULT FALSE"))
            print("Columna 'precio_colaborador_aplicado' agregada a tabla detalle_factura.")
        except Exception as e:
            print(f"Error o ya existe 'precio_colaborador_aplicado' en detalle_factura: {e}")
            
        try:
            conn.execute(text("ALTER TABLE detalle_factura ADD COLUMN tipo_descuento VARCHAR(20)")) 
            print("Columna 'tipo_descuento' agregada a tabla detalle_factura.")
        except Exception as e:
            print(f"Error o ya existe 'tipo_descuento' en detalle_factura: {e}")

        try:
            conn.execute(text("ALTER TABLE detalle_factura ADD COLUMN valor_descuento_aplicado NUMERIC(10, 2)")) 
            print("Columna 'valor_descuento_aplicado' agregada.")
        except Exception as e:
            print(f"Error o ya existe 'valor_descuento_aplicado' en detalle_factura: {e}")
            
        conn.commit()
    print("Migracion completada.")

if __name__ == "__main__":
    run_migration()
