import requests
import re

def analyze_more_js():
    email = "alejo0789@gmail.com"
    password = "Large1234"
    login_url = "https://app.lizto.co/login"
    
    session = requests.Session()
    # 1. Login
    response = session.get(login_url)
    csrf_token = re.search(r'name="_token"\s+value="([^"]+)"', response.text).group(1)
    payload = {'_token': csrf_token, 'email': email, 'password': password, 'recaptcha_token': ''}
    session.post(login_url, data=payload)
    
    # 2. Check scripts
    scripts = [
        "https://app.lizto.co/dist/static/js/chunk-common.b618d543.js",
        "https://app.lizto.co/dist/static/js/chunk-vendors.4db2e5f4.js",
        "https://app.lizto.co/dist/static/js/app/app.7a9578dc.js"
    ]
    
    keywords = ["cliente", "appointment", "product", "cita", "v1/", "v2/"]
    
    for js_url in scripts:
        print(f"\nAnalizando {js_url}...")
        js_res = session.get(js_url)
        content = js_res.text
        
        for kw in keywords:
            # Buscar el contexto de la palabra clave (ej. url: "/...")
            matches = re.findall(r'["\']([^"\']*{kw}[^"\']*)["\']'.format(kw=kw), content)
            if matches:
                print(f" - [{kw}] Encontrados {len(matches)} matches. Ejemplo: {matches[0]}")

if __name__ == "__main__":
    analyze_more_js()
