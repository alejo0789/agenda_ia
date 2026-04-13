import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()

# Ver el usuario actual de la sesión para confirmar su ID real
res = c.session.get(f"{c.base_url}/api/v1/users/me")
print("USER ME STATUS:", res.status_code)
if res.status_code == 200:
    data = res.json()
    user = data.get('data', {}).get('result', data.get('data', data))
    print(f"  ID: {user.get('id')}")
    print(f"  Nombre: {user.get('first_name')} {user.get('last_name')}")
    print(f"  UUID: {user.get('uuid')}")
    actual_user_id = user.get('id')
else:
    print(res.text[:300])
    actual_user_id = None

print(f"\nUser UUID de sesión: {c.user_uuid}")
print(f"User ID hardcoded: {c.user_id}")

# Intenta con el user_id que viene de la sesión real
if actual_user_id and actual_user_id != 189:
    print(f"\n=== PROBANDO CON user_id={actual_user_id} (real de la sesión) ===")
    from datetime import datetime, timedelta
    payload = {
        "booked_by": "APP",
        "customer_id": 15098,
        "date": "2026-04-15",
        "location_id": 8,
        "user_id": actual_user_id,
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
    res2 = c.session.post(f"{c.base_url}/api/v1/reservations", json=payload)
    print(f"STATUS: {res2.status_code}")
    print(res2.text[:400])

# También verificar el user_id 189 en la API  
res3 = c.session.get(f"{c.base_url}/api/v1/users/189")
print(f"\nUser 189 STATUS: {res3.status_code}")
if res3.status_code == 200:
    u = res3.json().get('data',{}).get('result',{})
    print(f"  {u.get('first_name')} {u.get('last_name')} - location: {u.get('location_id')}")
