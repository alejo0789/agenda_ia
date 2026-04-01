import requests
import re
import json

def fetch_ids():
    email = "alejo0789@gmail.com"
    password = "Large1234"
    session = requests.Session()
    base_url = "https://app.lizto.co"
    
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })

    print("--- Autenticando ---")
    res = session.get(f"{base_url}/login")
    csrf_token = re.search(r'name="_token"\s+value="([^"]+)"', res.text).group(1)
    session.post(f"{base_url}/login", data={'_token': csrf_token, 'email': email, 'password': password})

    home_res = session.get(f"{base_url}/home_shortcuts")
    api_token = re.search(r'name="csrf-token"\s+content="([^"]+)"', home_res.text).group(1)
    session.headers.update({'x-csrf-token': api_token, 'lizto-tenant-slug': 'large_sas'})

    results = {}

    # 1. Buscar Cliente
    print("Buscando cliente 1113783425...")
    c_res = session.get(f"{base_url}/api/v1/customers?q=1113783425")
    if c_res.status_code == 200:
        customers = c_res.json()
        if customers:
            results['customer'] = customers[0]
            print(f"ID Cliente: {customers[0]['id']} | Nombre: {customers[0]['full_names']}")
        else:
            print("Cliente no encontrado.")
    
    # 2. Buscar Servicio de Alisado
    print("Buscando servicio 'Alisado'...")
    s_res = session.get(f"{base_url}/api/v1/services?q=Alisado")
    if s_res.status_code == 200:
        services = s_res.json()
        results['services'] = services
        for s in services:
            print(f"ID Servicio: {s['id']} | Nombre: {s['name']}")
    
    # 3. Buscar Especialista
    print("Buscando especialistas...")
    st_res = session.get(f"{base_url}/api/v1/staff")
    if st_res.status_code == 200:
        staff = st_res.json()
        results['staff'] = staff
        if staff:
            print(f"ID Especialista sugerido: {staff[0]['name']} (ID: {staff[0]['id']})")
            
    return results

if __name__ == "__main__":
    fetch_ids()
