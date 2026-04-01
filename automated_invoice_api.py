import requests
import re
import json
from datetime import datetime

def automated_invoice_api():
    # 1. Configuración de Sesión "Modo Humano"
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest'
    })

    base_url = "https://app.lizto.co"
    creds = {"email": "alejo0789@gmail.com", "password": "Large1234"}

    print("--- Autenticando ---")
    login_page = session.get(f"{base_url}/login")
    csrf_init = re.search(r'name="_token"\s+value="([^"]+)"', login_page.text).group(1)
    
    # Login formal
    session.post(f"{base_url}/login", data={'_token': csrf_init, **creds})

    # 2. Inicializar contexto de la Sede/Caja
    print("--- Inicializando Contexto de Cali (Sede 8) ---")
    # Es vital entrar a la URL del POS para que el servidor "vincule" el usuario a la sede en la sesión
    pos_page = session.get(f"{base_url}/transactions/bill")
    
    # Extraer tokens actualizados del POS
    csrf_api = re.search(r'name="csrf-token"\s+content="([^"]+)"', pos_page.text).group(1)
    tenant = re.search(r'name="tenant-slug"\s+content="([^"]+)"', pos_page.text).group(1)
    
    session.headers.update({
        'x-csrf-token': csrf_api,
        'lizto-tenant-slug': tenant,
        'Referer': f"{base_url}/transactions/bill"
    })

    # 3. Crear Factura via API
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    payload = {
        "customer_id": 15098,  # Alejandro Carvajal
        "date": now,
        "register_id": 8,
        "location_id": 8,
        "details": [{
            "item_id": 178,    # Alisado Corto/Medio
            "item_price": 114900,
            "price_id": 890,
            "final_price": 114900,
            "quantity": 1,
            "staff_id": 334,   # Alejandra Agudelo
            "tax_rate": 0
        }],
        "payments": [{
            "pay_method_id": 1, # Efectivo
            "price": 114900,
            "date": now
        }],
        "on_hold": False
    }

    print(f"--- Enviando Petición API (Tenant: {tenant}) ---")
    res = session.post(f"{base_url}/api/v1/transactions", json=payload)
    
    print(f"Status: {res.status_code}")
    try:
        data = res.json()
        if res.status_code in [200, 201]:
            print(f"SUCCESS: Factura {data.get('consecutive')} creada vía SCRIPT.")
            return data
        else:
            print(f"ERROR: {data.get('message', res.text)}")
    except:
        print(f"ERROR (No JSON): {res.text}")

if __name__ == "__main__":
    automated_invoice_api()
