import os, json, sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()

srvs = c.get_services()
cali_active = [s for s in srvs if 8 in (s.get('allowed_locations_ids') or []) and s.get('active', True)]
print(f'Servicios activos en Cali: {len(cali_active)}')
for s in cali_active[:30]:
    sid = s["id"]
    sname = s["name"]
    print(f'  ID={sid} | {sname}')
