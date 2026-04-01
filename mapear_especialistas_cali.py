import sys
import os
import json

# Importar la Skill
sys.path.append(os.path.join(os.getcwd(), ".agents", "skills", "lizto_billing"))
from scripts.lizto_client import LiztoClient

def get_cali_staff_mapping():
    client = LiztoClient("alejo0789@gmail.com", "Large1234")
    CALI_LOCATION_ID = 8 # ID técnico de la sede Cali en Large SAS
    
    if client.login():
        print(f"--- Filtrando Especialistas para Sede Cali (ID {CALI_LOCATION_ID}) ---")
        staff_list = client.get_staff()
        
        if staff_list:
            mapping = []
            print(f"{'NOMBRE':<30} | {'ID':<10}")
            print("-" * 50)
            
            for member in staff_list:
                # Filtrar por ubicación permitida
                locations = member.get('allowed_locations_ids', [])
                if CALI_LOCATION_ID in locations:
                    name = member.get('full_name') or member.get('commercial_name') or "Desconocido"
                    member_id = member.get('id')
                    
                    print(f"{name:<30} | {member_id:<10}")
                    mapping.append({
                        "name": name,
                        "id": member_id,
                        "uuid": member.get('uuid')
                    })
            
            # Guardar en archivo específico de Cali
            mapping_path = os.path.join(os.getcwd(), "especialistas_cali.json")
            with open(mapping_path, 'w', encoding='utf-8') as f:
                json.dump(mapping, f, indent=4, ensure_ascii=False)
            
            print(f"\nOK: Mapeo de Cali guardado en: {mapping_path}")
        else:
            print("No se encontraron especialistas.")
    else:
        print("Login fallido.")

if __name__ == "__main__":
    get_cali_staff_mapping()
