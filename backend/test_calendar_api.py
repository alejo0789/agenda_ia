"""
Captura el trafico real del navegador al crear una cita en Lizto
para determinar el endpoint y payload exacto que usa el calendario.
"""
import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()

# El calendario de Lizto carga los servicios disponibles por staff
# Simular exactamente lo que hace el browser cuando abre el modal de nueva cita
c.session.headers.update({'Referer': 'https://app.lizto.co/calendar'})

# Variaciones del endpoint de servicios por staff (para el calendario)
tests = [
    f"/api/v1/staff/293/services",
    f"/api/v1/staff/293/services?location_id=8",
    f"/api/v1/services?staff_id=293&location_id=8",
    f"/api/v1/services?staff_id=293",
    f"/api/v1/staff-services?staff_id=293&location_id=8",
]

print("=== BUSCANDO ENDPOINT DE SERVICIOS POR STAFF ===")
for ep in tests:
    res = c.session.get(f"https://app.lizto.co{ep}")
    print(f"  {ep}: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        items = data.get('data',{}).get('result',{}).get('items', data.get('items', [data]))
        if items:
            print(f"    >> {len(items) if isinstance(items, list) else 'found'} items")
            if isinstance(items, list) and items:
                it = items[0]
                print(f"    >> First: {json.dumps(it, ensure_ascii=False)[:300]}")
        break

# Ver si existe algun endpoint de diagnóstico del calendario
print("\n=== VERIFICANDO DISPONIBILIDAD DEL STAFF ===")
res = c.session.get("https://app.lizto.co/api/v1/staff/293/availability", 
    params={"date": "2026-04-15", "location_id": 8})
print(f"  avail STATUS: {res.status_code}")
if res.status_code == 200:
    print(f"  {res.text[:500]}")

# Tambien probemos si hay un endpoint de schedule
res2 = c.session.get("https://app.lizto.co/api/v1/staff-schedules", 
    params={"staff_id": 293, "date": "2026-04-15"})
print(f"  schedule STATUS: {res2.status_code}")
if res2.status_code == 200:
    print(f"  {res2.text[:500]}")
