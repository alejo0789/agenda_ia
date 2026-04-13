import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text

engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    print("=== MAPEOS DE ESPECIALISTAS ===")
    rows = conn.execute(text("""
        SELECT e.id, e.nombre, e.apellido, m.lizto_staff_id, m.lizto_staff_name
        FROM especialistas e
        LEFT JOIN especialista_lizto_mapping m ON m.especialista_id = e.id
        WHERE e.estado = 'activo'
        ORDER BY e.id
    """)).fetchall()
    for r in rows:
        status = f"-> Lizto: {r[3]} ({r[4]})" if r[3] else "-> SIN MAPEO"
        print(f"  [{r[0]}] {r[1]} {r[2] or ''} {status}")

    print("\n=== MAPEOS DE SERVICIOS ===")
    rows2 = conn.execute(text("""
        SELECT s.id, s.nombre, m.lizto_service_id, m.lizto_price_id, m.lizto_price_value, m.lizto_service_name
        FROM servicios s
        LEFT JOIN servicio_lizto_mapping m ON m.servicio_id = s.id
        WHERE s.activo = true
        ORDER BY s.id
    """)).fetchall()
    for r in rows2:
        if r[2]:
            valid = "✅" if r[2] != r[3] else "⚠️ price_id=service_id (fallback)"
            print(f"  [{r[0]}] {r[1]} -> Lizto:{r[2]} ({r[5]}) price_id={r[3]} {valid}")
        else:
            print(f"  [{r[0]}] {r[1]} -> SIN MAPEO")

    print("\n=== CITAS PENDIENTES DE PUBLICAR ===")
    rows3 = conn.execute(text("""
        SELECT c.id, c.fecha, c.hora_inicio, c.duracion_minutos,
               cl.nombre || ' ' || COALESCE(cl.apellido,'') as cliente,
               e.nombre || ' ' || COALESCE(e.apellido,'') as especialista,
               s.nombre as servicio,
               c.especialista_id, c.servicio_id
        FROM citas c
        JOIN clientes cl ON cl.id = c.cliente_id
        JOIN especialistas e ON e.id = c.especialista_id
        JOIN servicios s ON s.id = c.servicio_id
        WHERE c.fecha >= CURRENT_DATE
        AND c.lizto_reservation_id IS NULL
        ORDER BY c.fecha, c.hora_inicio
        LIMIT 10
    """)).fetchall()
    for r in rows3:
        print(f"  Cita #{r[0]} | {r[1]} {r[2]} | {r[4]} | {r[5]} (esp_id={r[7]}) | {r[6]} (srv_id={r[8]})")
