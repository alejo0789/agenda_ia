from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres:root@localhost:5432/club_alisados"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Sedes existentes:")
    result = conn.execute(text("SELECT id, nombre FROM sedes"))
    for row in result:
        print(f"ID: {row[0]}, Nombre: {row[1]}")
    
    print("\nUsuarios y sus sedes:")
    result = conn.execute(text("""
        SELECT u.username, s.nombre 
        FROM usuarios u 
        LEFT JOIN sedes s ON u.sede_id = s.id
    """))
    for row in result:
        print(f"Usuario: {row[0]}, Sede: {row[1]}")
