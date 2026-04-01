# Skill: Manejo de Facturación y Calendario - Lizto API

Maneja el proceso completo de registro de clientes, agendamiento de citas en el calendario y ventas (POS) en la plataforma Lizto.

## 🚀 Capacidades

### 1. Clientes (Customers)
- **Creación**: Crea un cliente con los campos obligatorios del calendario (CC, Nombre, Celular, Dirección).
- **Búsqueda**: Utiliza una consulta JSON codificada (`findCustomerManyParameters`) para encontrar clientes por identificación (ID/CC).

### 2. Citas (Calendar)
- **Agendamiento**: Crea reservas en el calendario vinculando:
  - `customer_id`: ID interno de Lizto (no la identificación/CC).
  - `service_id`: ID del servicio técnico de Lizto.
  - `staff_id`: ID del especialista asignado.
  - `selected_for_customer`: Flag obligatorio para indicar si se eligió al especialista.

### 3. Facturas (Sales / POS)
- **Ingesta**: Crea una transacción en el módulo de ventas (POS) con:
  - `lizto-tenant-slug`: Prefijo de la empresa (ej: `large_sas`).
  - `user_id`: ID del usuario generador (ej: `189`).
  - `details`: Array de servicios facturados con IDs temporales.

---

## 🛠️ Cómo Utilizarla (Importación)

Para usar esta skill en tus scripts de Python:

```python
import sys, os
sys.path.append(os.path.join(os.getcwd(), ".agents", "skills", "lizto_billing"))
from scripts.lizto_client import LiztoClient

client = LiztoClient("tu_email@gmail.com", "tu_password")

if client.login():
    # 1. Buscar Cliente
    customer = client.search_customer("1113783425")
    
    # 2. Agendar Cita
    client.create_appointment(
        customer_id=customer['id'],
        service_id=44,
        price_id=570,
        price_value=32000,
        staff_id=286,
        date_str="2026-04-01",
        start_time="14:30:00"
    )
    
    # 3. Crear Factura
    client.create_invoice(
        customer_id=customer['id'],
        service_id=178,
        price_id=890,
        amount=350000,
        staff_id=334
    )
```

## ⚠️ Consideraciones Técnicas
- **Referer**: Para las citas, el header `Referer` debe ser `https://app.lizto.co/calendar`.
- **CSRF Token**: Se extrae automáticamente durante el login e inicialización de contexto.
- **IDs de Sede**: Cali es `source_location_id: 8`.
