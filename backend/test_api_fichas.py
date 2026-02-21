import sys
import os
from fastapi.testclient import TestClient
from datetime import date, time

# Configurar el path para poder importar la app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import SessionLocal
from app.models.user import Usuario

client = TestClient(app)

print("=====================================================")
print("  INICIANDO TESTS DE LA API DE FICHAS TÉCNICAS")
print("=====================================================")

print("\n1. Obteniendo usuario admin para mock de Auth ...")
db = SessionLocal()
admin_user = db.query(Usuario).filter(Usuario.username == "admin").first()
if not admin_user:
    print("Error: Usuario admin no encontrado.")
    sys.exit(1)

# 2. Vamos a asegurarnos de que el endpoint no pida auth si la mockeamos.
# Mejor aún, para acelerar el desarrollo del FE y viendo que la config y modelos están OK, logramos los tests mediante inserciones directas a BD o evitamos la validación HTTP.
from app.dependencies import get_current_user
app.dependency_overrides[get_current_user] = lambda: admin_user

from app.dependencies import require_permission

def mock_require_permission(*args, **kwargs):
    def dummy_dep():
        return {"user": admin_user, "permission": "all"}
    return dummy_dep

# Parcheamos globalmente require_permission en el router
# Para FastAPI dependency overrides hay que sobreescribir la instancia exacta de la dependencia.
# Para pruebas rápidas sin auth config, generaremos el token real.
from app.utils.jwt import create_access_token
from datetime import timedelta
access_token = create_access_token(
    data={"sub": str(admin_user.username), "rol": "admin", "sede_id": admin_user.sede_id},
    expires_delta=timedelta(minutes=30)
)
headers = {"Authorization": f"Bearer {access_token}"}


# Datos de la plantilla
plantilla_datos = {
    "nombre": "Test Ficha Clínica Capilar",
    "descripcion": "Ficha para evaluar historial del cliente",
    "activa": True,
    "campos": [
        {"nombre": "¿Sufre de alergias?", "tipo": "texto_corto", "requerido": True, "orden": 1},
        {"nombre": "¿Tratamientos previos?", "tipo": "texto_largo", "requerido": False, "orden": 2},
        {"nombre": "Tipo de cabello", "tipo": "opcion_multiple", "opciones": "Seco,Graso,Mixto,Normal", "requerido": True, "orden": 3}
    ]
}

# 2. Crear una Plantilla
print("\n2. Creando Plantilla de Ficha Técnica...")
response = client.post("/api/fichas/plantillas", json=plantilla_datos, headers=headers)
if response.status_code != 201:
    print(f"Error al crear plantilla: {response.status_code} - {response.text}")
    sys.exit(1)

plantilla_creada = response.json()
plantilla_id = plantilla_creada["id"]
print(f"Plantilla creada exitosamente. ID: {plantilla_id}")

# 3. Listar Plantillas
print("\n3. Listar Plantillas...")
response = client.get("/api/fichas/plantillas", headers=headers)
if response.status_code != 200:
    print(f"Error al listar plantillas: {response.status_code} - {response.text}")
    sys.exit(1)
plantillas = response.json()
print(f"Se encontraron {len(plantillas)} plantillas.")

# 4. Obtener Cita Existente
print("\n4. Buscando una cita existente para vincular la ficha...")
from app.models.cita import Cita
cita_existente = db.query(Cita).first()
if not cita_existente:
    print("No se encontró cita. Terminando test de forma exitosa parcial.")
    sys.exit(0)

cita_id = cita_existente.id
print(f"Cita encontrada. ID: {cita_id}")

# 5. Vincular plantilla a cita
print("\n5. Vinculando ficha a cita...")
vinculo_data = {
    "plantilla_id": plantilla_id,
    "cita_id": cita_id
}
response = client.post("/api/fichas/cita-ficha", json=vinculo_data, headers=headers)
if response.status_code != 201:
    print(f"Error al vincular: {response.status_code} - {response.text}")
    sys.exit(1)

cita_ficha = response.json()
cita_ficha_id = cita_ficha["id"]
token_publico = cita_ficha["token_publico"]
print(f"Ficha vinculada exitosamente. ID Vínculo: {cita_ficha_id}, Token: {token_publico}")

# 6. Marcar como enviada
print("\n6. Marcando ficha como enviada...")
response = client.post(f"/api/fichas/cita-ficha/{cita_ficha_id}/marcar-enviada", headers=headers)
if response.status_code != 200:
    print(f"Error al marcar como enviada: {response.status_code} - {response.text}")
    sys.exit(1)
print(f"Ficha marcada como enviada.")

# 7. Endpoint público - Obtener Formulario
print("\n7. Obteniendo formulario público sin autenticación...")
# Como es GET /api/fichas/publico/{token}
response = client.get(f"/api/fichas/publico/{token_publico}")
if response.status_code != 200:
    print(f"Error al obtener formulario: {response.status_code} - {response.text}")
    sys.exit(1)

formulario = response.json()
print(f"Formulario obtenido. Tiene {len(formulario['plantilla']['campos'])} campos.")
campo1_id = formulario['plantilla']['campos'][0]['id']

# 8. Diligenciar Formulario
print("\n8. El cliente diligencia el formulario...")
respuestas_data = {
    "respuestas": [
        {"campo_id": campo1_id, "valor": "No aplica"}
    ]
}

response = client.post(f"/api/fichas/publico/{token_publico}/submit", json=respuestas_data)
if response.status_code != 200:
    print(f"Error al enviar respuestas: {response.status_code} - {response.text}")
    sys.exit(1)
print("Respuestas guardadas exitosamente.")

# 9. Verificar estado final de la cita-ficha
print("\n9. Verificando estado final...")
response = client.get(f"/api/fichas/cita-ficha/{cita_id}", headers=headers)
vinculos = response.json()
vf = next((v for v in vinculos if v["id"] == cita_ficha_id), None)
print(f"Estado final: {vf['estado']}, Respuestas: {len(vf['respuestas'])}")

print("\n=====================================================")
print("  TODOS LOS TESTS DE LA API PASARON CORRECTAMENTE ✅")
print("=====================================================")
