from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql://postgres:root@localhost:5432/club_alisados"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Roles y sus permisos:")
    result = conn.execute(text("""
        SELECT r.nombre as rol, p.codigo as permiso
        FROM roles r
        JOIN rol_permisos rp ON r.id = rp.rol_id
        JOIN permisos p ON p.id = rp.permiso_id
        ORDER BY r.nombre, p.codigo
    """))
    for row in result:
        print(f"Role: {row[0]} | Permission: {row[1]}")
