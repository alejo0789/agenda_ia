"""
Script de prueba para el módulo de Control de Acceso
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def print_response(response, title):
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")

def test_auth_module():
    print("\n" + "="*60)
    print("TESTING CONTROL DE ACCESO MODULE")
    print("="*60)
    
    # 1. Test root endpoint
    response = requests.get(f"{BASE_URL}/")
    print_response(response, "1. Root Endpoint")
    
    # 2. List roles (should fail - no auth)
    response = requests.get(f"{BASE_URL}/api/roles")
    print_response(response, "2. List Roles (No Auth - Should Fail)")
    
    # 3. Create a test user (should fail - no auth)
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "nombre": "Test User",
        "password": "Test123!@#",
        "rol_id": 1
    }
    response = requests.post(f"{BASE_URL}/api/usuarios", json=user_data)
    print_response(response, "3. Create User (No Auth - Should Fail)")
    
    # 4. Login with admin (assuming there's an admin user)
    # First, let's try to create an admin user directly in the database
    print("\n" + "="*60)
    print("NOTE: To test login, you need to create a user first.")
    print("You can do this via the database or by temporarily removing")
    print("authentication from the POST /api/usuarios endpoint.")
    print("="*60)
    
    # 5. Test login endpoint structure
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data=login_data  # OAuth2 uses form data
    )
    print_response(response, "4. Login Test (Will fail if no user exists)")
    
    # 6. List permissions (should fail - no auth)
    response = requests.get(f"{BASE_URL}/api/permisos")
    print_response(response, "5. List Permissions (No Auth - Should Fail)")
    
    print("\n" + "="*60)
    print("TESTING COMPLETE")
    print("="*60)
    print("\nNext steps:")
    print("1. Create an admin user in the database")
    print("2. Test login with that user")
    print("3. Use the token to test protected endpoints")

if __name__ == "__main__":
    test_auth_module()
