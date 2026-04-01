import requests
import re
import random
import string
from datetime import datetime

def generate_temp_id(length=9):
    """Genera un ID temporal similar al de Lizto (ej: 2f335ta0p)"""
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def create_invoice_api_v5():
    session = requests.Session()
    base_url = "https://app.lizto.co"
    
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': f"{base_url}/transactions/bill"
    })

    print("--- 1. Login ---")
    res = session.get(f"{base_url}/login")
    csrf_init = re.search(r'name="_token"\s+value="([^"]+)"', res.text).group(1)
    session.post(f"{base_url}/login", data={'_token': csrf_init, 'email': "alejo0789@gmail.com", 'password': "Large1234"})

    print("--- 2. Captura de Contexto ---")
    pos_page = session.get(f"{base_url}/transactions/bill")
    csrf_api = re.search(r'name="csrf-token"\s+content="([^"]+)"', pos_page.text).group(1)
    tenant = re.search(r'name="tenant-slug"\s+content="([^"]+)"', pos_page.text).group(1)
    user_uuid = re.search(r'name="user-uuid"\s+content="([^"]+)"', pos_page.text).group(1)
    # Extraer el USER_ID numerico (se encuentra en el window.User o meta)
    # Segun la captura previa es 189
    user_id = 189 

    session.headers.update({
        'x-csrf-token': csrf_api,
        'lizto-tenant-slug': tenant,
        'lizto-user-uuid': user_uuid
    })

    # 3. Construccion del Payload "Humano"
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    temp_id = generate_temp_id()
    
    payload = {
        "customer_id": 15098,
        "date": now,
        "register_id": 8,
        "location_id": 8,
        "details": [{
            "id": temp_id,
            "item_id": 42918,
            "item_price": 114900,
            "price_id": 891,
            "final_price": 114900,
            "quantity": 1,
            "staff_id": 334,
            "tax_rate": 0,
            "user_id": user_id,
            "_isNew": True,
            "_isEdited": False
        }],
        "payments": [{
            "pay_method_id": 1, 
            "price": 114900,
            "date": now,
            "user_id": user_id
        }],
        "on_hold": False,
        "tax": 0,
        "total": 114900
    }

    print(f"--- 3. Enviando Factura (TempID: {temp_id}) ---")
    response = session.post(f"{base_url}/api/v1/transactions", json=payload)
    
    if response.status_code in [200, 201]:
        print("SUCCESS: Factura creada exitosamente via SCRIPT (API).")
        data = response.json()
        print(f"Consecutivo: {data.get('consecutive')}")
        print(f"ID Transaccion: {data.get('id')}")
    else:
        print(f"FAIL: Status {response.status_code}")
        print(f"Mensaje: {response.text}")

if __name__ == "__main__":
    create_invoice_api_v5()
