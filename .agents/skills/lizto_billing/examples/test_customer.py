import sys
import os
import random

# Importar la Skill
sys.path.append(os.path.join(os.getcwd(), ".agents", "skills", "lizto_billing"))
from scripts.lizto_client import LiztoClient

def test_create_customer():
    client = LiztoClient("alejo0789@gmail.com", "Large1234")
    
    if client.login():
        # Generar identificación aleatoria para evitar error de duplicado (mínimo 10 digitos)
        random_id = random.randint(1000000000, 9999999999)
        
        test_phone = f"32{random.randint(10000000, 99999999)}"
        
        # Crear Cliente
        new_customer = client.create_customer(
            first_name="Cliente", 
            last_name="Prueba Skill", 
            identification=random_id, 
            phone=test_phone, 
            email=f"prueba_{random_id}@gmail.com"
        )
        
        if new_customer:
            print("OK: Cliente creado correctamente.")
            print(f"Nombre: {new_customer.get('commercial_name')}")
            # Intentar obtener ID de diferentes niveles
            customer_id = new_customer.get('id') or (new_customer.get('data', {}).get('id') if isinstance(new_customer.get('data'), dict) else None)
            print(f"ID del Cliente: {customer_id}")
    else:
        print("Login fallido.")

if __name__ == "__main__":
    test_create_customer()
