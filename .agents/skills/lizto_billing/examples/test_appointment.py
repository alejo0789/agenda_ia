import sys
import os
from datetime import datetime

# Importar la Skill
sys.path.append(os.path.join(os.getcwd(), ".agents", "skills", "lizto_billing"))
from scripts.lizto_client import LiztoClient

def test_full_appointment_flow():
    client = LiztoClient("alejo0789@gmail.com", "Large1234")
    
    if client.login():
        # 1. Buscar Cliente por Identificación
        query = "1113783425"
        customer = client.search_customer(query)
        
        if customer:
            customer_id = customer.get('id')
            print(f"OK: Cliente encontrado. ID: {customer_id} | Nombre: {customer.get('commercial_name')}")
            
            # Datos técnicos capturados del Alisado/Lavado
            service_id = 44   # Lavado y Secado Post Alisado
            price_id = 570
            price_value = 32000
            staff_id = 286   # Carolina Salgado
            
            # 2. Agendar Cita para Hoy
            today = datetime.now().strftime("%Y-%m-%d")
            # Hora sugerida: 2:30 PM (14:30:00)
            start_time = "14:30:00"
            duration = "00:15:00"
            
            appointment = client.create_appointment(
                customer_id=customer_id,
                service_id=service_id,
                price_id=price_id,
                price_value=price_value,
                staff_id=staff_id,
                date_str=today,
                start_time=start_time,
                duration=duration
            )
            
            if appointment:
                print("--- ¡AGENDAMIENTO EXITOSO! ---")
                reserva_id = appointment.get('data', {}).get('id')
                print(f"ID Reserva: {reserva_id}")
                print(f"Cita agendada para: {today} a las {start_time}")
        else:
            print(f"FAIL: No se encontró al cliente con identificación {query}")
    else:
        print("Login fallido.")

if __name__ == "__main__":
    test_full_appointment_flow()
