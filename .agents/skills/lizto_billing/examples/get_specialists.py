import sys
import os
import json

# Importar la Skill
sys.path.append(os.path.join(os.getcwd(), ".agents", "skills", "lizto_billing"))
from scripts.lizto_client import LiztoClient

def main():
    client = LiztoClient("alejo0789@gmail.com", "Large1234")
    CALI_LOCATION_ID = 8 
    
    if client.login():
        staff_list = client.get_staff()
        
        if staff_list:
            # Filtrar por Cali
            cali_staff = [
                {
                    "id": m.get('id'),
                    "uuid": m.get('uuid'),
                    "name": m.get('full_name') or m.get('commercial_name')
                }
                for m in staff_list 
                if CALI_LOCATION_ID in m.get('allowed_locations_ids', [])
            ]
            
            # Imprimir JSON formateado en terminal
            print(json.dumps(cali_staff, indent=4, ensure_ascii=False))
            
            # Guardar copia de respaldo
            with open("specialists_current.json", "w", encoding="utf-8") as f:
                json.dump(cali_staff, f, indent=4, ensure_ascii=False)
        else:
            print(json.dumps({"error": "No se encontraron especialistas"}, indent=4))
    else:
        print(json.dumps({"error": "Login fallido"}, indent=4))

if __name__ == "__main__":
    main()
