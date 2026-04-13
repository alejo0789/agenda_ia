import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()

# Cambiar el Referer al calendario para simular exactamente lo que hace el navegador
c.session.headers.update({'Referer': 'https://app.lizto.co/calendar'})

# Intentar obtener los precios de servicios del calendario
# (el endpoint que usa el frontend cuando seleccionas un servicio en el calendaio)
endpoints_to_try = [
    f"/api/v1/service-prices?service_id=178&location_id=8",
    f"/api/v1/item-prices?service_id=178",
    f"/api/v1/services/178/prices",
    f"/api/v1/service-price-values?service_id=178",
]

for ep in endpoints_to_try:
    res = c.session.get(f"https://app.lizto.co{ep}")
    print(f"  {ep}: {res.status_code}")
    if res.status_code == 200:
        print(f"    >> {res.text[:300]}")

# Buscar el item en el inventario POS que corresponde al servicio 178
# Los scripts de factura usan item_id=42918 para el alisado
# Vamos a buscar el item correcto para el servicio 178
print("\n=== BUSCANDO ITEM DEL SERVICIO 178 EN POS ===")
res = c.session.get("https://app.lizto.co/api/v1/transactions/item-select", 
    params={"location_id": 8, "search": "CORTO"})
print(f"  STATUS: {res.status_code}")
if res.status_code == 200:
    data = res.json()
    items = data.get('data',{}).get('result',{}).get('items',[])
    for it in items[:5]:
        print(f"  ID={it.get('id')} service_id={it.get('service_id')} price_id={it.get('price_id')} {it.get('name')}")

# También intentar el endpoint de items del calendario
print("\n=== ITEMS DEL CALENDARIO ===")
res2 = c.session.get("https://app.lizto.co/api/v1/calendar-services", 
    params={"location_id": 8, "staff_id": 293})
print(f"  STATUS: {res2.status_code}")
if res2.status_code == 200:
    data = res2.json()
    print(json.dumps(data, indent=2)[:1000])
