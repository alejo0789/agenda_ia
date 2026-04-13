import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()

# Verificar si service 225 esta activo en Cali (location 8)
srvs = c.get_services()
srv225 = next((s for s in srvs if s['id'] == 225), None)
if srv225:
    in_cali = 8 in (srv225.get('allowed_locations_ids') or [])
    active = srv225.get('active', False)
    print(f"Servicio 225: {srv225['name']}")
    print(f"  Activo: {active}")
    print(f"  En Cali (loc 8): {in_cali}")
    print(f"  Sedes permitidas: {srv225.get('allowed_locations_ids')}")
else:
    print("Servicio 225 NO ENCONTRADO en Lizto")

print()
print("=== PROBANDO CON SERVICIO 178 (CORTO/MEDIO - activo en Cali) ===")
# Probar con servicio 178 que confirmamos estaba activo en Cali
result_ok = c.session.post(f"{c.base_url}/api/v1/reservations", json={
    "booked_by": "APP",
    "customer_id": 15098,
    "date": "2026-04-12",
    "location_id": 8,
    "user_id": 189,
    "details": [{
        "date": "2026-04-12 18:00:00",
        "duration": "03:00:00",
        "end": "21:00:00",
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
        "start": "18:00:00"
    }],
    "notifications": [],
    "repetitions": []
})
print(f"STATUS: {result_ok.status_code}")
print(result_ok.text[:500])
