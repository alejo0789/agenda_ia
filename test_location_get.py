import requests
import re
import json

def set_location_get():
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

    print(f"Setting location via GET to /api/v1/user/set-location/8...")
    loc_res = session.get(f"{base_url}/api/v1/user/set-location/8")
    print(f"Set Location Status: {loc_res.status_code}")
    print(f"Set Location Content: {loc_res.text[:200]}")

    # Try GET staff
    test_res = session.get(f"{base_url}/api/v1/staff")
    print(f"Staff GET Status: {test_res.status_code}")
    if test_res.status_code == 200:
        print("Success! Access granted.")

if __name__ == "__main__":
    set_location_get()
