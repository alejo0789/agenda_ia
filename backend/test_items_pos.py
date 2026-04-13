import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()

# El script de factura usa item_id=42918, price_id=891 para alisado
# Vamos a buscar el item del POS que corresponde al service_id=178 Y 225

# Endpoint de items que usa el POS (el mismo que usa el v6 script)
res = c.session.get("https://app.lizto.co/api/v1/items", 
    params={"location_id": 8, "type": "SERVICE", "limit": 500})
print(f"STATUS: {res.status_code}")
if res.status_code == 200:
    data = res.json()
    items = data.get('data',{}).get('result',{}).get('items', [])
    print(f"Total items: {len(items)}")
    for it in items:
        sid = it.get('service_id')
        if sid in [178, 225, 179, 180]:
            print(f"\nItem ID={it.get('id')} service_id={sid} name={it.get('name')}")
            print(f"  price_id={it.get('price_id')} price={it.get('price')}")
            print(f"  active={it.get('active')} location_ids={it.get('allowed_locations_ids')}")
else:
    # Intentar con otro endpoint
    res2 = c.session.get("https://app.lizto.co/api/v1/items/list/select",
        params={"location_id": 8})
    print(f"list/select STATUS: {res2.status_code}")
    if res2.status_code == 200:
        data = res2.json()
        items = data.get('data',{}).get('result',{}).get('items', [])
        print(f"Total: {len(items)}")
        for it in items:
            sid = it.get('service_id')
            if sid in [178, 225]:
                print(f"  service_id={sid} item_id={it.get('id')} price_id={it.get('price_id')} price={it.get('price')}")
