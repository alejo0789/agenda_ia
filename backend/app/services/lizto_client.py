import os
import requests
import re
import random
import string
from datetime import datetime
import json
import urllib.parse

class LiztoClient:
    """Clase para interactuar de forma programática con la API interna de Lizto."""
    
    def __init__(self, email, password, base_url="https://app.lizto.co"):
        self.email = email
        self.password = password
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': f"{base_url}/transactions/bill"
        })
        self.csrf_token = None
        self.tenant_slug = None
        self.user_uuid = None
        self.user_id = 189  # ID numérico para Large SAS Cali

    def _generate_temp_id(self, length=9):
        chars = string.ascii_lowercase + string.digits
        return ''.join(random.choice(chars) for _ in range(length))

    def login(self):
        print(f"--- Iniciando Login para {self.email} ---")
        try:
            res = self.session.get(f"{self.base_url}/login")
            csrf_init = re.search(r'name="_token"\s+value="([^"]+)"', res.text).group(1)
            
            payload = {'_token': csrf_init, 'email': self.email, 'password': self.password}
            login_res = self.session.post(f"{self.base_url}/login", data=payload)
            
            if login_res.status_code in [200, 302]:
                print("Login exitoso.")
                return self.init_context()
            else:
                print(f"Error en login: {login_res.status_code}")
                return False
        except Exception as e:
            print(f"Excepción en login: {e}")
            return False

    def init_context(self):
        print("--- Sincronizando contexto de POS ---")
        try:
            # Cargar primero la página de POS para el CSRF
            res = self.session.get(f"{self.base_url}/transactions/bill")
            self.csrf_token = re.search(r'name="csrf-token"\s+content="([^"]+)"', res.text).group(1)
            self.tenant_slug = re.search(r'name="tenant-slug"\s+content="([^"]+)"', res.text).group(1)
            self.user_uuid = re.search(r'name="user-uuid"\s+content="([^"]+)"', res.text).group(1)
            
            self.session.headers.update({
                'x-csrf-token': self.csrf_token,
                'lizto-tenant-slug': self.tenant_slug,
                'lizto-user-uuid': self.user_uuid
            })
            print(f"Contexto cargado: {self.tenant_slug} | CSRF Listo.")
            
            # Cargar también la página del calendario para sincronizar el contexto de reservas
            cal_res = self.session.get(f"{self.base_url}/calendar")
            if cal_res.status_code == 200:
                # Actualizar el CSRF con el del calendario si es diferente
                cal_csrf = re.search(r'name="csrf-token"\s+content="([^"]+)"', cal_res.text)
                if cal_csrf:
                    self.csrf_token = cal_csrf.group(1)
                    self.session.headers.update({'x-csrf-token': self.csrf_token})
                print("--- Contexto de calendario sincronizado ---")
            
            return True
        except Exception as e:
            print(f"Error cargando contexto: {e}")
            return False


    def create_customer(self, first_name, last_name, identification, phone, email):
        print(f"--- Creando Cliente: {first_name} {last_name} ---")
        payload = {
            "active": True,
            "customer_is_staff": False,
            "notes_display_on_booking": False,
            "loyalty_enable": True,
            "is_enterprise": False,
            "tax_id_id": 3,
            "is_blocked_to_online_booking": False,
            "tax_obligations": [],
            "related_tags": [],
            "tags_accounting": [],
            "log_notes": [],
            "customer_extra_datas": [],
            "customer_extra_enterprises": [],
            "enterprise_location_id": None,
            "source_location_id": 8,
            "contact_cellphone_indicator": "57",
            "contact_cellphone_ind_iso2": "co",
            "location_postal_code": "000000",
            "loyalty_program": None,
            "birthday_month": None,
            "birthday_day": None,
            "dv": 1,
            "apply_customer_products_all_location": True,
            "customer_addresses": [
                {
                    "_isNew": True,
                    "_isEdited": False,
                    "_isDeleted": False,
                    "_original": None,
                    "line_location_main": True,
                    "line_location_address": None,
                    "line_location_postal_code": "000000",
                    "line_location_departament_id": None,
                    "line_location_municipality_id": None,
                    "line_location_neighborhood": None,
                    "line_location_country_id": None
                }
            ],
            "customer_products": [],
            "first_name": first_name,
            "commercial_name": f"{first_name} {last_name}",
            "last_name": last_name,
            "identification": str(identification),
            "contact_cellphone": str(phone),
            "email": email,
            "user_id": self.user_id
        }

        res = self.session.post(f"{self.base_url}/api/v1/customers", json=payload)
        
        if res.status_code in [200, 201]:
            data = res.json()
            result = data.get('data', {}).get('result', {})
            customer_id = result.get('id')
            return result
        return None

    def search_customer(self, query_text):
        query_obj = {
            "_wap": ["total_balance_vouchers", "total_balance", "total_invoice_balance", "has_active_plans", "sales_points"],
            "_with": [],
            "_c": {
                "active": [],
                "findCustomerManyParameters": [str(query_text)]
            },
            "_limit": 20
        }
        
        query_json = json.dumps(query_obj)
        encoded_query = urllib.parse.quote(query_json)
        url = f"{self.base_url}/api/v1/customers/list/select?query={encoded_query}"
        
        headers = {"Referer": f"{self.base_url}/calendar"}
        res = self.session.get(url, headers=headers)
        
        if res.status_code == 200:
            data = res.json()
            result = data.get('data', {}).get('result', {})
            items = result.get('items', [])
            if isinstance(items, list) and len(items) > 0:
                return items[0]
        return None

    def get_staff(self):
        res = self.session.get(f"{self.base_url}/api/v1/staff")
        if res.status_code == 200:
            data = res.json()
            result = data.get('data', {}).get('result', {})
            return result.get('items', [])
        return []

    def get_services(self):
        # Intentamos con el endpoint general primero
        res = self.session.get(f"{self.base_url}/api/v1/services")
        if res.status_code == 200:
            data = res.json()
            # La respuesta puede estar en data.result.items o directamente en data.items
            items = data.get('data', {}).get('result', {}).get('items', [])
            if not items:
                items = data.get('items', [])
            if items:
                return items

        # Si falla, intentamos con el de list/select que a veces funciona mejor para el POS
        res = self.session.get(f"{self.base_url}/api/v1/services/list/select")
        if res.status_code == 200:
            data = res.json()
            return data.get('data', {}).get('result', {}).get('items', [])
            
        return []

    def create_appointment(self, customer_id, service_id, price_id, price_value, staff_id, date_str, start_time, duration="00:30:00"):
        from datetime import datetime, timedelta
        start_dt = datetime.strptime(f"{date_str} {start_time}", "%Y-%m-%d %H:%M:%S")
        h, m, s = map(int, duration.split(':'))
        end_dt = start_dt + timedelta(hours=h, minutes=m, seconds=s)
        end_time = end_dt.strftime("%H:%M:%S")

        payload = {
            "booked_by": "APP",
            "customer_id": customer_id,
            "date": date_str,
            "location_id": 8,
            "user_id": self.user_id,
            "details": [
                {
                    "date": f"{date_str} {start_time}",
                    "duration": duration,
                    "end": end_time,
                    "from_combo": False,
                    "from_plan": False,
                    **({"price_id": price_id} if price_id and price_id != service_id else {}),
                    "price_value": price_value if price_value else 0,
                    "price_value_changed": False,
                    "selected_for_customer": False,
                    "seller_id": None,
                    "service_combos": [],
                    "service_plans": [],
                    "service_id": service_id,
                    "staff_id": staff_id,
                    "start": start_time
                }
            ],
            "notifications": [],
            "repetitions": []
        }

        import json as _json
        print(f"=== PAYLOAD ENVIADO A LIZTO ===")
        print(_json.dumps(payload, indent=2))
        
        res = self.session.post(f"{self.base_url}/api/v1/reservations", json=payload)
        
        print(f"=== RESPUESTA LIZTO: {res.status_code} ===")
        print(res.text[:1000])
        
        if res.status_code in [200, 201]:
            data = res.json()
            # The structure of response can vary, sometimes it's direct sometimes in data
            res_id = data.get('id') or (data.get('data') and data.get('data', {}).get('id'))
            return res_id
        else:
            raise Exception(f"Error Lizto: {res.text}")
