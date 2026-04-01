import sys
import os
import json

# Importar la Skill
sys.path.append(os.path.join(os.getcwd(), ".agents", "skills", "lizto_billing"))
from scripts.lizto_client import LiztoClient

def get_staff_mapping():
    client = LiztoClient("alejo0789@gmail.com", "Large1234")
    
    if client.login():
        print("--- Consultando Listado de Especialistas ---")
        staff_list = client.get_staff()
        
        if staff_list:
            mapping = []
            print(f"{'NOMBRE':<30} | {'ID':<10}")
            print("-" * 50)
            
            for member in staff_list:
                name = member.get('full_name') or member.get('commercial_name') or "Desconocido"
                member_id = member.get('id')
                
                print(f"{name:<30} | {member_id:<10}")
                mapping.append({
                    "name": name,
                    "id": member_id
                })
            
            # Guardar en JSON para consulta rápida
            mapping_path = os.path.join(os.getcwd(), "especialistas_lizto.json")
            with open(mapping_path, 'w', encoding='utf-8') as f:
                json.dump(mapping, f, indent=4, ensure_ascii=False)
            
            print(f"\n✅ Mapeo completo guardado en: {mapping_path}")
        else:
            print("No se encontraron especialistas o la lista está vacía.")
    else:
        print("Login fallido.")

if __name__ == "__main__":
    get_staff_mapping()
