import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()

# Probar distintas combinaciones para encontrar cuál funciona
tests = [
    {"service_id": 178, "staff_id": 293, "date": "2026-04-15", "start": "09:00:00", "duration": "03:00:00", "price": 114900, "label": "Alisado corto, miércoles 9am"},
    {"service_id": 178, "staff_id": 293, "date": "2026-04-16", "start": "09:00:00", "duration": "03:00:00", "price": 114900, "label": "Alisado corto, jueves 9am"},
    {"service_id": 225, "staff_id": 293, "date": "2026-04-15", "start": "09:00:00", "duration": "03:00:00", "price": 114900, "label": "Garantia, miércoles 9am, con precio"},
    {"service_id": 178, "staff_id": 286, "date": "2026-04-15", "start": "09:00:00", "duration": "03:00:00", "price": 114900, "label": "Alisado corto, staff 286 (Carolina Salgado), miércoles 9am"},
]

for t in tests:
    from datetime import datetime, timedelta
    start_dt = datetime.strptime(f"{t['date']} {t['start']}", "%Y-%m-%d %H:%M:%S")
    h, m, s = map(int, t['duration'].split(':'))
    end_dt = start_dt + timedelta(hours=h, minutes=m, seconds=s)
    end_time = end_dt.strftime("%H:%M:%S")
    
    payload = {
        "booked_by": "APP",
        "customer_id": 15098,
        "date": t['date'],
        "location_id": 8,
        "user_id": 189,
        "details": [{
            "date": f"{t['date']} {t['start']}",
            "duration": t['duration'],
            "end": end_time,
            "from_combo": False,
            "from_plan": False,
            "price_value": t['price'],
            "price_value_changed": False,
            "selected_for_customer": False,
            "seller_id": None,
            "service_combos": [],
            "service_plans": [],
            "service_id": t['service_id'],
            "staff_id": t['staff_id'],
            "start": t['start']
        }],
        "notifications": [],
        "repetitions": []
    }
    
    res = c.session.post(f"{c.base_url}/api/v1/reservations", json=payload)
    status = "✅ OK" if res.status_code in [200, 201] else f"❌ {res.status_code}"
    msg = res.json().get('message', '') if res.status_code != 200 else "CREADA"
    print(f"{status} | {t['label']}")
    print(f"       {msg}")
    
    if res.status_code in [200, 201]:
        data = res.json()
        res_id = data.get('id') or data.get('data', {}).get('id')
        print(f"       >> Reservation ID: {res_id}")
        # Cancelar inmediatamente para no ensuciar el calendario
        if res_id:
            c.session.delete(f"{c.base_url}/api/v1/reservations/{res_id}")
            print(f"       >> Reserva de prueba eliminada.")
        break
    print()
