import sys
import os

# Importar la clase desde la estructura de la Skill Local
sys.path.append(os.path.join(os.getcwd(), ".agents", "skills", "lizto_billing"))
from scripts.lizto_client import LiztoClient

def test_lizto_skill():
    # 1. Configurar cliente
    client = LiztoClient("alejo0789@gmail.com", "Large1234")
    
    # 2. Ejecutar Login
    if client.login():
        print("Skill validada: Sesion iniciada correctamente.")
        
        # 3. Crear Factura de Prueba (Alisado para Alejandro Carvajal)
        # item_id: 42918, price_id: 891
        invoice = client.create_invoice(customer_id=15098, item_id=42918, price_id=891)
        
        if invoice:
            print(f"Factura exitosa. Consecutivo: {invoice.get('consecutive')}")
            print(f"ID Transaccion: {invoice.get('id')}")
    else:
        print("La skill fallo en la fase de login.")

if __name__ == "__main__":
    test_lizto_skill()
