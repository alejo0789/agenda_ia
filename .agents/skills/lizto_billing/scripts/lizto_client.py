import requests
import re
import random
import string
from datetime import datetime

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
        """Genera un ID local para ítems de Vue.js"""
        chars = string.ascii_lowercase + string.digits
        return ''.join(random.choice(chars) for _ in range(length))

    def login(self):
        """Paso 1: Autenticación inicial y obtención de cookie de sesión."""
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
        """Paso 2: Sincronización de tokens CSRF y UUIDs de la página de Caja."""
        print("--- Sincronizando contexto de POS ---")
        try:
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
            return True
        except Exception as e:
            print(f"Error cargando contexto: {e}")
            return False

    def create_invoice(self, customer_id, item_id, price_id, price=114900, staff_id=334, register_id=8, location_id=8):
        """Paso 3: Envío de factura al API de transacciones."""
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        payload = {
            "customer_id": customer_id,
            "description": "",
            "generate_as_electronic": None,
            "contact_id": None,
            "discount": None,
            "tax_id": None,
            "date": now,
            "register_id": register_id,
            "location_id": location_id,
            "details": [{
                "id": self._generate_temp_id(),
                "item_id": item_id,
                "rent_rented": False,
                "_isNew": True,
                "_isEdited": False,
                "item_price": price,
                "price_id": price_id,
                "final_price": price,
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
                "staff_id": staff_id,
                "commission": None,
                "user_id": self.user_id,
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
                "pay_method_id": 1, # Efectivo
                "price": price,
                "date": now,
                "user_id": self.user_id
            }],
            "customer_address": None,
            "on_hold": False,
            "_with_a": [
                "customer_info",
                "payments_voucher_code",
                "payments_credit_note_full_consecutive"
            ]
        }

        print(f"--- Creando Factura para Cliente {customer_id} ---")
        res = self.session.post(f"{self.base_url}/api/v1/transactions", json=payload)
        
        if res.status_code in [200, 201]:
            print("Factura creada exitosamente.")
            return res.json()
        else:
            print(f"Falla en creación: {res.status_code} - {res.text}")
            return None

    def create_customer(self, first_name, last_name, identification, phone, email):
        """Crea un nuevo cliente en Lizto con la estructura exacta del calendario."""
        print(f"--- Creando Cliente: {first_name} {last_name} ---")
        
        payload = {
            "active": True,
            "customer_is_staff": False,
            "notes_display_on_booking": False,
            "loyalty_enable": True,
            "is_enterprise": False,
            "tax_id_id": 3, # Cédula
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
            # Mapeo según estructura observada: data -> result -> id
            result = data.get('data', {}).get('result', {})
            customer_id = result.get('id')
            print(f"SUCCESS: Cliente creado con ID {customer_id}")
            return result # Devolvemos el objeto 'result' que tiene los datos limpios
        else:
            print(f"FAIL: Status {res.status_code}")
            print(f"Respuesta: {res.text}")
            return None

    def search_customer(self, query_text):
        """Busca un cliente usando el endpoint de selección del calendario (Estructura JSON)."""
        import json
        import urllib.parse
        
        # Estructura forense capturada del navegador
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
        
        # Sintonizar el Referer para el Calendario
        headers = {"Referer": f"{self.base_url}/calendar"}
        res = self.session.get(url, headers=headers)
        
        if res.status_code == 200:
            data = res.json()
            # Estructura observada: data -> result -> items
            result = data.get('data', {}).get('result', {})
            items = result.get('items', [])
            
            if isinstance(items, list) and len(items) > 0:
                print(f"SUCCESS: Cliente encontrado: {items[0].get('commercial_name')}")
                return items[0]
        return None

    def get_staff(self):
        """Obtiene la lista de especialistas (staff) de la sede."""
        res = self.session.get(f"{self.base_url}/api/v1/staff")
        if res.status_code == 200:
            data = res.json()
            # Estructura forense: data -> result -> items
            result = data.get('data', {}).get('result', {})
            return result.get('items', [])
        return []

    def create_appointment(self, customer_id, service_id, price_id, price_value, staff_id, date_str, start_time, duration="00:30:00"):
        """
        Crea una cita en el calendario.
        - date_str: "YYYY-MM-DD"
        - start_time: "HH:MM:SS"
        - duration: "HH:MM:SS"
        """
        print(f"--- Agendando Cita: Cliente {customer_id} | Servicio {service_id} ---")
        
        # Calcular hora de fin aproximada (simplificado para el script)
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
                    "price_id": price_id,
                    "price_value": price_value,
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

        res = self.session.post(f"{self.base_url}/api/v1/reservations", json=payload)
        
        if res.status_code in [200, 201]:
            data = res.json()
            # Mapeo: data -> id o data -> data -> id
            res_id = data.get('id') or data.get('data', {}).get('id')
            print(f"SUCCESS: Cita creada. ID Reserva: {res_id}")
            return data
        else:
            print(f"FAIL: Status {res.status_code}")
            print(f"Respuesta: {res.text}")
            return None

if __name__ == "__main__":
    # Test simple
    client = LiztoClient("alejo0789@gmail.com", "Large1234")
    if client.login():
        invoice = client.create_invoice(customer_id=15098, item_id=42918, price_id=891)
        if invoice:
            print(f"Consecutivo Final: {invoice.get('consecutive') or 'Generado'}")
