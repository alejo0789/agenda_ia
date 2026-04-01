import requests
import re
import json
from datetime import datetime

def create_invoice():
    email = "alejo0789@gmail.com"
    password = "Large1234"
    base_url = "https://app.lizto.co"
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })

    print("--- Autenticando ---")
    res = session.get(f"{base_url}/login")
    csrf_init = re.search(r'name="_token"\s+value="([^"]+)"', res.text).group(1)
    session.post(f"{base_url}/login", data={'_token': csrf_init, 'email': email, 'password': password})

    home_res = session.get(f"{base_url}/home_shortcuts")
    api_token = re.search(r'name="csrf-token"\s+content="([^"]+)"', home_res.text).group(1)
    tenant_slug = re.search(r'name="tenant-slug"\s+content="([^"]+)"', home_res.text).group(1)
    
    session.headers.update({
        'x-csrf-token': api_token,
        'lizto-tenant-slug': tenant_slug
    })

    print(f"Tenant: {tenant_slug} | Sede: 8")
    print("--- Creando Factura ---")
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Payload simplificado (quitando user_id manual)
    payload = {
        "customer_id": 15098,
        "description": "Factura - Alisado",
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
            "pay_method_id": 1, 
            "price": 114900,
            "date": now
        }],
        "on_hold": False
    }

    invoice_res = session.post(f"{base_url}/api/v1/transactions", json=payload)
    print(f"Status: {invoice_res.status_code}")
    
    try:
        data = invoice_res.json()
        if invoice_res.status_code in [200, 201]:
            print("¡FACTURA CREADA EXITOSAMENTE!")
            print(f"Consecutivo: {data.get('consecutive', 'N/A')}")
        else:
            print(f"Error: {data.get('message', invoice_res.text)}")
    except:
        print(f"Error (No JSON): {invoice_res.text}")

if __name__ == "__main__":
    create_invoice()
