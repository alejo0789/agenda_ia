import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()

# Probar con fecha FUTURA (mañana) y el mismo staff/service del log
result = c.create_appointment(
    customer_id=15098,
    service_id=225,
    price_id=None,
    price_value=114900,  # precio real
    staff_id=293,
    date_str="2026-04-14",  # fecha futura
    start_time="10:00:00",
    duration="03:00:00"
)
print("Resultado:", json.dumps(result, indent=2) if result else "FALLÓ")
