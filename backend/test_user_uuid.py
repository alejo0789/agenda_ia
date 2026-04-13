import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()

# Buscar el user_id real que tiene el UUID de la sesion
print(f"UUID de sesion: {c.user_uuid}")

# Obtener lista de usuarios para encontrar el ID real del usuario logueado
res = c.session.get(f"{c.base_url}/api/v1/users?uuid={c.user_uuid}")
print(f"users by uuid STATUS: {res.status_code}")

# Intentar con el endpoint de calendar para obtener reservas y ver que user_id usa
res2 = c.session.get(f"{c.base_url}/api/v1/users", params={"limit": 5, "location_id": 8})
print(f"users STATUS: {res2.status_code}")
if res2.status_code == 200:
    data = res2.json()
    items = data.get('data',{}).get('result',{}).get('items',[])
    for u in items:
        print(f"  ID={u.get('id')} UUID={u.get('uuid')} {u.get('first_name')} {u.get('last_name')}")

# Ahora probar la cita usando el uuid como user identifier en lugar del id numerico
# Algunos sistemas de Lizto usan uuid en el field user_id
print("\n=== PROBANDO CON user_uuid en lugar de numeric id ===")
from datetime import datetime, timedelta
payload = {
    "booked_by": "APP",
    "customer_id": 15098,
    "date": "2026-04-15",
    "location_id": 8,
    "user_id": c.user_uuid,  # usar el UUID de la sesion
    "details": [{
        "date": "2026-04-15 09:00:00",
        "duration": "03:00:00",
        "end": "12:00:00",
        "from_combo": False,
        "from_plan": False,
        "price_value": 114900,
        "price_value_changed": False,
        "selected_for_customer": False,
        "seller_id": None,
        "service_combos": [],
        "service_plans": [],
        "service_id": 178,
        "staff_id": 293,
        "start": "09:00:00"
    }],
    "notifications": [],
    "repetitions": []
}
res3 = c.session.post(f"{c.base_url}/api/v1/reservations", json=payload)
print(f"STATUS: {res3.status_code}")
print(res3.text[:400])
