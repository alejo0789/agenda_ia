import requests
import re
import json

def diagnose():
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

    # Get home metadata
    home_res = session.get(f"{base_url}/home_shortcuts")
    
    # Extract IDs from meta tags
    user_uuid = re.search(r'name="user-uuid"\s+content="([^"]+)"', home_res.text)
    tenant_slug = re.search(r'name="tenant-slug"\s+content="([^"]+)"', home_res.text)
    cur_location = re.search(r'name="cur-location-id"\s+content="([^"]+)"', home_res.text)
    csrf_api = re.search(r'name="csrf-token"\s+content="([^"]+)"', home_res.text)

    print(f"User UUID: {user_uuid.group(1) if user_uuid else 'N/A'}")
    print(f"Tenant Slug: {tenant_slug.group(1) if tenant_slug else 'N/A'}")
    print(f"Location ID: {cur_location.group(1) if cur_location else 'N/A'}")
    
    if csrf_api:
        session.headers.update({
            'x-csrf-token': csrf_api.group(1),
            'lizto-tenant-slug': tenant_slug.group(1) if tenant_slug else 'large_sas'
        })
    
    # Try to find user_id (integer)
    print("\n--- Consultando /api/v1/staff (Especialistas) ---")
    st_res = session.get(f"{base_url}/api/v1/staff")
    if st_res.status_code == 200:
        print(f"Staff count: {len(st_res.json())}")
        # Encontrar el user_id del usuario actual (probablemente el primero o uno específico)
        for s in st_res.json():
            print(f"Staff: {s['name']} | ID: {s['id']} | UserID: {s.get('user_id')}")

if __name__ == "__main__":
    diagnose()
