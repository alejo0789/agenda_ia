import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings
from sqlalchemy import create_engine, text

# Leer el primer mapeo disponible
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    # Obtener mapeo de especialista
    r_esp = conn.execute(text('SELECT * FROM especialista_lizto_mapping LIMIT 1')).fetchone()
    # Obtener mapeo de servicio
    r_srv = conn.execute(text('SELECT * FROM servicio_lizto_mapping LIMIT 1')).fetchone()
    # Obtener una cita de hoy o futura
    r_cita = conn.execute(text("""
        SELECT c.*, cl.cedula, cl.telefono, cl.nombre as cli_nombre, cl.apellido as cli_apellido, cl.email as cli_email
        FROM citas c
        JOIN clientes cl ON cl.id = c.cliente_id
        WHERE c.fecha >= CURRENT_DATE
        AND c.especialista_id = :esp_id
        AND c.lizto_reservation_id IS NULL
        LIMIT 1
    """), {"esp_id": r_esp[0] if r_esp else 0}).fetchone()

print("=== MAPEO ESPECIALISTA ===")
if r_esp:
    print(f"  SIAgenda ID: {r_esp[0]} -> Lizto Staff ID: {r_esp[1]} ({r_esp[2]})")
else:
    print("  NO HAY MAPEO DE ESPECIALISTA")

print("=== MAPEO SERVICIO ===")
if r_srv:
    print(f"  SIAgenda ID: {r_srv[0]} -> Lizto Service ID: {r_srv[1]} (Price ID: {r_srv[2]}, Valor: {r_srv[3]})")
else:
    print("  NO HAY MAPEO DE SERVICIO")

print("=== CITA A PUBLICAR ===")
if r_cita:
    print(f"  Cita ID: {r_cita[0]}, Fecha: {r_cita[3]}, Hora: {r_cita[4]}, Duración: {r_cita[9]} min")
    print(f"  Cliente: {r_cita['cli_nombre']} {r_cita['cli_apellido']}, Cédula: {r_cita['cedula']}, Tel: {r_cita['telefono']}")
else:
    print("  NO HAY CITA PENDIENTE para ese especialista")
    sys.exit(0)

# Ahora hacer la prueba real
c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()

# Buscar o crear cliente
search_q = r_cita['cedula'] or r_cita['telefono']
print(f"\n=== BUSCANDO CLIENTE: {search_q} ===")
customer = c.search_customer(search_q)
if customer:
    print(f"  Encontrado: ID={customer.get('id')} | {customer.get('commercial_name')}")
    customer_id = customer.get('id')
else:
    print("  No encontrado, creando...")
    new_c = c.create_customer(
        first_name=r_cita['cli_nombre'],
        last_name=r_cita['cli_apellido'] or '',
        identification=r_cita['cedula'] or '000000000',
        phone=r_cita['telefono'] or '0000000000',
        email=r_cita['cli_email'] or f"noreply_{r_cita[1]}@example.com"
    )
    customer_id = new_c.get('id') if new_c else None

print(f"  Customer ID Lizto: {customer_id}")

if not customer_id:
    print("ERROR: No se pudo obtener customer_id")
    sys.exit(1)

# Crear la cita de prueba
from datetime import datetime, timedelta
fecha = str(r_cita[3])
hora = str(r_cita[4])
if len(hora) == 5:
    hora = hora + ':00'

duracion_min = r_cita[9] or 180
h = duracion_min // 60
m = duracion_min % 60
duration_str = f"{h:02d}:{m:02d}:00"

staff_id = r_esp[1]
service_id = r_srv[1]
price_id = r_srv[2]
price_value = float(r_srv[3]) if r_srv[3] else 0

print(f"\n=== CREANDO CITA ===")
print(f"  customer_id={customer_id}, service_id={service_id}, staff_id={staff_id}")
print(f"  fecha={fecha}, hora={hora}, duration={duration_str}")
print(f"  price_id={price_id}, price_value={price_value}")

result = c.create_appointment(
    customer_id=customer_id,
    service_id=service_id,
    price_id=price_id,
    price_value=price_value,
    staff_id=staff_id,
    date_str=fecha,
    start_time=hora,
    duration=duration_str
)

if result:
    print("=== ÉXITO ===")
    print(json.dumps(result, indent=2)[:500])
else:
    print("=== FALLÓ ===")
