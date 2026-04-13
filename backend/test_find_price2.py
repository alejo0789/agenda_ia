import sys, os, json, urllib.parse
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()
c.session.headers.update({'Referer': 'https://app.lizto.co/calendar'})

# Enfoque diferente: obtener los price_values via el endpoint de services sin filtro extra
# y luego buscar el price_id via el endpoint de transacciones (items del POS)
# El price_id=570 del ejemplo era para service_id=44 (Lavado)
# Necesitamos el equivalente para service_id=178 (Alisado Corto/Medio)

# Buscar en el endpoint de items de transacciones filtrado por servicio
res = c.session.get('https://app.lizto.co/api/v1/transaction-items', 
    params={'service_id': 178, 'location_id': 8, 'limit': 5})
print('transaction-items STATUS:', res.status_code)
if res.status_code == 200:
    print(res.text[:500])

# Otro enfoque: buscar el item_id que usa el POS para facturar el servicio 178
# Los items del POS tienen service_id y price_id asociados
res2 = c.session.get('https://app.lizto.co/api/v1/items?service_id=178&location_id=8&limit=5')
print('items by service STATUS:', res2.status_code)
if res2.status_code == 200:
    data = res2.json()
    items = data.get('data',{}).get('result',{}).get('items',[])
    print(f'Items: {len(items)}')
    for it in items:
        print(f"  id={it.get('id')} price_id={it.get('price_id')} price={it.get('price')} name={it.get('name')}")
else:
    print(res2.text[:200])

# Intentar buscar los price values directamente
res3 = c.session.get('https://app.lizto.co/api/v1/price-values?service_id=178&location_id=8')
print('price-values STATUS:', res3.status_code)
if res3.status_code == 200:
    print(res3.text[:500])

# Buscar en el endpoint de price items
res4 = c.session.get('https://app.lizto.co/api/v1/item-price-values?service_id=178&location_id=8')
print('item-price-values STATUS:', res4.status_code)
