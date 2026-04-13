import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()
c.session.headers.update({'Referer': 'https://app.lizto.co/calendar'})

# Obtener el servicio 178 completo con toda su informacion
res = c.session.get("https://app.lizto.co/api/v1/services?staff_id=293&location_id=8")
data = res.json()
items = data.get('data',{}).get('result',{}).get('items', [])
srv178 = next((s for s in items if s['id'] == 178), None)

if srv178:
    print("=== SERVICIO 178 COMPLETO ===")
    print(json.dumps(srv178, indent=2, ensure_ascii=False))
else:
    print("Servicio 178 no encontrado en staff 293")
    # Ver los primeros activos en Cali
    cali = [s for s in items if 8 in (s.get('allowed_locations_ids') or []) and s.get('active', True)]
    print(f"Activos en Cali: {len(cali)}")
    if cali:
        print("Primero activo:")
        print(json.dumps(cali[0], indent=2, ensure_ascii=False))
