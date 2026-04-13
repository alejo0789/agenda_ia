import sys, os, json, urllib.parse
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()
c.session.headers.update({'Referer': 'https://app.lizto.co/calendar'})

# Buscar con _wap para traer price_values en el endpoint de servicios del calendario
query = {'_wap': ['price_values'], '_c': {'active': []}, '_limit': 5}
encoded = urllib.parse.quote(json.dumps(query))
res = c.session.get(f'https://app.lizto.co/api/v1/services?staff_id=293&location_id=8&query={encoded}')
print('STATUS:', res.status_code)
if res.status_code == 200:
    data = res.json()
    items = data.get('data',{}).get('result',{}).get('items',[])
    srv = next((s for s in items if s.get('id') == 178), items[0] if items else None)
    if srv:
        name = srv.get('name')
        sid = srv.get('id')
        print(f'Servicio: {name} ID={sid}')
        print('price_values:', srv.get('price_values'))
        print('current_price_value:', srv.get('current_price_value'))
        print('Todas las keys:', list(srv.keys()))
