import requests
import re
import json
from datetime import datetime

def finalize_invoice():
    # 1. Configuración de Sesión "Modo Navegador"
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://app.lizto.co',
        'Referer': 'https://app.lizto.co/transactions/bill'
    })

    # 2. Login
    print("--- Autenticando Sesión ---")
    login_page = session.get("https://app.lizto.co/login")
    csrf_token = re.search(r'name="_token"\s+value="([^"]+)"', login_page.text).group(1)
    session.post("https://app.lizto.co/login", data={
        '_token': csrf_token, 
        'email': "alejo0789@gmail.com", 
        'password': "Large1234"
    })

    # 3. Obtener Metadatos Críticos
    dashboard = session.get("https://app.lizto.co/home_shortcuts")
    api_token = re.search(r'name="csrf-token"\s+content="([^"]+)"', dashboard.text).group(1)
    tenant = re.search(r'name="tenant-slug"\s+content="([^"]+)"', dashboard.text).group(1)
    
    session.headers.update({
        'x-csrf-token': api_token,
        'lizto-tenant-slug': tenant
    })

    # 4. Crear la Transacción
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    payload = {
        "customer_id": 15098,
        "date": now,
        "register_id": 8,
        "location_id": 8,
        "details": [{
            "item_id": 178,
            "item_price": 114900,
            "price_id": 890,
            "final_price": 114900,
            "quantity": 1,
            "staff_id": 334,
            "tax_rate": 0
        }],
        "payments": [{
            "pay_method_id": 1, # Efectivo
            "price": 114900,
            "date": now
        }],
        "on_hold": False
    }

    print(f"--- Enviando Factura (Tenant: {tenant}, Cliente ID: 15098) ---")
    response = session.post("https://app.lizto.co/api/v1/transactions", json=payload)
    
    if response.status_code in [200, 201]:
        try:
            data = response.json()
            print(f"SUCCESS: Factura creada. Consecutivo: {data.get('consecutive')}")
        except:
            print(f"SUCCESS: Factura creada. Respuesta: {response.text}")
    else:
        print(f"FAIL {response.status_code}: {response.text}")

if __name__ == "__main__":
    finalize_invoice()
