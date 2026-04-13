import os, sys, json
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from app.services.lizto_client import LiztoClient
from app.config import settings

c = LiztoClient(settings.lizto_email, settings.lizto_password)
c.login()
c.session.headers.update({'Referer': 'https://app.lizto.co/calendar'})

base_payload = {
    "customer_id": 15098,
    "date": "2026-04-15",
    "location_id": 8,
    "user_id": 189,
    "details": [{
        "date": "2026-04-15 09:00:00",
        "duration": "03:00:00",
        "end": "12:00:00",
        "from_combo": False,
        "from_plan": False,
        "price_value": 114900,
        "price_value_changed": False,
        "selected_for_customer": False,
        "seller_id": None,
        "service_combos": [],
        "service_plans": [],
        "service_id": 178,
        "staff_id": 293,
        "start": "09:00:00"
    }],
    "notifications": [],
    "repetitions": []
}

# Test diferentes valores de booked_by
for booked_by in ["ADMIN", "CALENDAR", "AGENDA", None]:
    payload = {**base_payload, "booked_by": booked_by}
    if booked_by is None:
        del payload["booked_by"]
        label = "SIN booked_by"
    else:
        label = f"booked_by={booked_by}"
    
    res = c.session.post(f"{c.base_url}/api/v1/reservations", json=payload)
    msg = ""
    try:
        msg = res.json().get('message','')[:80]
    except:
        msg = res.text[:80]
    ok = "OK" if res.status_code in [200,201] else "FAIL"
    print(f"  [{ok}] {label}: {res.status_code} | {msg}")
    
    if res.status_code in [200, 201]:
        res_id = res.json().get('id') or res.json().get('data',{}).get('id')
        if res_id:
            c.session.delete(f"{c.base_url}/api/v1/reservations/{res_id}")
            print(f"    >> Reserva {res_id} eliminada")
        break
