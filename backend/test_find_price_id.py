import sys, os, json, urllib.parse
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()

# Buscar los precios de los servicios activos usando el endpoint de transacciones
# El price_id es el ID del "precio" en la tabla de precios de Lizto
# Probamos buscando via el endpoint de items del POS con filtro de actividad

# El script v6 usa item_id=42918 price_id=891 -- intentemos buscar ese item para ver la estructura
res = c.session.get('https://app.lizto.co/api/v1/transactions',
    params={'location_id': 8, 'limit': 1})
print('transactions STATUS:', res.status_code)

# Mejor: buscar el price_id via el endpoint que usa el frontend del calendario
# al hacer clic en un servicio para autocompletar el monto
# Esto suele ser un endpoint de /api/v1/service-prices o /api/v1/prices
for ep in [
    '/api/v1/prices?service_id=178&location_id=8',
    '/api/v1/prices?active=1&location_id=8',
    '/api/v1/price-lists?location_id=8',
    '/api/v1/service-price-lists?service_id=178',
]:
    r = c.session.get(f'https://app.lizto.co{ep}')
    print(f'{ep}: {r.status_code}')
    if r.status_code == 200:
        print(r.text[:400])
        break

# La alternativa: ver una transaccion existente para ver la estructura del price_id
res2 = c.session.get('https://app.lizto.co/api/v1/transactions?limit=1&location_id=8')
print('transactions STATUS:', res2.status_code)
if res2.status_code == 200:
    data = res2.json()
    items = data.get('data',{}).get('result',{}).get('items',[])
    if items:
        details = items[0].get('details', [])
        if details:
            d = details[0]
            print(f"price_id={d.get('price_id')} service_id={d.get('service_id')} item_id={d.get('item_id')}")
