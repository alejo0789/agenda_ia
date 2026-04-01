import requests
import re
import random
import string
from datetime import datetime

def generate_temp_id(length=9):
    """Genera un ID temporal identico al de Lizto"""
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def create_invoice_final_v6():
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

    print("--- 2. Sincronizacion de Tokens ---")
    pos_page = session.get(f"{base_url}/transactions/bill")
    
    csrf_api = re.search(r'content="([^"]+)"\s+name="csrf-token"', pos_page.text) or re.search(r'name="csrf-token"\s+content="([^"]+)"', pos_page.text)
    tenant = re.search(r'name="tenant-slug"\s+content="([^"]+)"', pos_page.text)
    user_uuid = re.search(r'name="user-uuid"\s+content="([^"]+)"', pos_page.text)

    if not (csrf_api and tenant and user_uuid):
        print("Error: No se capturaron los tokens de seguridad.")
        return

    session.headers.update({
        'x-csrf-token': csrf_api.group(1),
        'lizto-tenant-slug': tenant.group(1),
        'lizto-user-uuid': user_uuid.group(1)
    })

    # 3. Payload Forense (Copia exacta de la captura 8082)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    user_id = 189
    
    payload = {
        "customer_id": 15098,
        "description": "",
        "generate_as_electronic": None,
        "contact_id": None,
        "discount": None,
        "tax_id": None,
        "date": now,
        "register_id": 8,
        "location_id": 8,
        "details": [{
            "id": generate_temp_id(),
            "item_id": 42918,
            "rent_rented": False,
            "_isNew": True,
            "_isEdited": False,
            "item_price": 114900,
            "price_id": 891,
            "final_price": 114900,
            "price_locked": True,
            "quantity_locked": False,
            "discount_locked": False,
            "quantity": 1,
            "is_award": False,
            "sales_points": 0,
            "type_sales_points": "NONE",
            "discount": None,
            "award_points": 0,
            "is_voucher": False,
            "from_plan": False,
            "from_combo": False,
            "staff_id": 334,
            "commission": None,
            "user_id": user_id,
            "tax_id": None,
            "tax_rate": 0,
            "external_consumer_products": [],
            "consumer_products": [],
            "collaborating_staff": [],
            "consumer_products_deleted": [],
            "collaborating_staff_deleted": []
        }],
        "details_deleted": [],
        "payments": [{
            "pay_method_id": 1,
            "price": 114900,
            "date": now,
            "user_id": user_id
        }],
        "customer_address": None,
        "on_hold": False,
        "_with_a": [
            "customer_info",
            "payments_voucher_code",
            "payments_credit_note_full_consecutive"
        ]
    }

    print("--- 3. Enviando Peticion Maestra ---")
    response = session.post(f"{base_url}/api/v1/transactions", json=payload)
    
    if response.status_code in [200, 201]:
        print("SUCCESS: Factura creada via API exitosamente.")
        data = response.json()
        print(f"Consecutivo: {data.get('consecutive')}")
    else:
        print(f"FAIL: Status {response.status_code}")
        print(f"Respuesta: {response.text}")

if __name__ == "__main__":
    create_invoice_final_v6()
