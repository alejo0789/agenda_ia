import requests
import re
import json
from datetime import datetime

def create_alisado_invoice_final():
    session = requests.Session()
    # Encabezados base para simular el navegador perfectamente
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://app.lizto.co/transactions/bill'
    })

    base_url = "https://app.lizto.co"
    
    print("--- 1. Login ---")
    res = session.get(f"{base_url}/login")
    csrf_init = re.search(r'name="_token"\s+value="([^"]+)"', res.text).group(1)
    session.post(f"{base_url}/login", data={'_token': csrf_init, 'email': "alejo0789@gmail.com", 'password': "Large1234"})

    print("--- 2. Captura de Tokens de Sesi\u00f3n ---")
    # Entramos al POS para "anclar" la sede en la sesi\u00f3n del servidor
    pos_page = session.get(f"{base_url}/transactions/bill")
    
    csrf_api_match = re.search(r'name="csrf-token"\s+content="([^"]+)"', pos_page.text)
    tenant_match = re.search(r'name="tenant-slug"\s+content="([^"]+)"', pos_page.text)
    user_uuid_match = re.search(r'name="user-uuid"\s+content="([^"]+)"', pos_page.text)
    
    if not (csrf_api_match and tenant_match and user_uuid_match):
        print("Error: No se pudieron capturar todos los tokens necesarios.")
        return

    csrf_api = csrf_api_match.group(1)
    tenant = tenant_match.group(1)
    user_uuid = user_uuid_match.group(1)
    
    session.headers.update({
        'x-csrf-token': csrf_api,
        'lizto-tenant-slug': tenant,
        'lizto-user-uuid': user_uuid
    })

    print(f"Sesi\u00f3n validada para: {tenant} | Usuario: {user_uuid[:8]}...")

    # 3. Datos de la Factura (Basados en la captura exitosa 8080)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    payload = {
        "customer_id": 15098,
        "date": now,
        "register_id": 8,
        "location_id": 8,
        "details": [{
            "item_id": 42918,  # ID exacto del servicio Alisado Corto/Medio
            "item_price": 114900,
            "price_id": 891,   # ID exacto del precio
            "final_price": 114900,
            "quantity": 1,
            "staff_id": 334,   # Alejandra Agudelo
            "tax_rate": 0
        }],
        "payments": [{
            "pay_method_id": 1, 
            "price": 114900,
            "date": now
        }],
        "on_hold": False
    }

    print("--- 3. Enviando Factura via API ---")
    response = session.post(f"{base_url}/api/v1/transactions", json=payload)
    
    if response.status_code in [200, 201]:
        print("SUCCESS: Factura creada via API.")
        try:
            data = response.json()
            print(f"Consecutivo generado: {data.get('consecutive')}")
        except:
            print(f"Respuesta (No JSON): {response.text}")
    else:
        print(f"FAIL: Status {response.status_code}")
        print(f"Respuesta: {response.text}")

if __name__ == "__main__":
    create_alisado_invoice_final()
